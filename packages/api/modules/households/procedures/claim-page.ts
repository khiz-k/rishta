import {
	biodataProfile,
	db,
	getHouseholdById,
	getPageByUserId,
	householdSetting,
	invitation,
	member,
	partnerPreference,
	user as userTable,
	wallet,
} from "@repo/database";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { ageFromDateOfBirth } from "../../../lib/time";
import { protectedProcedure } from "../../../orpc/procedures";
import { firstNameOf } from "../../biodata/lib/page-view";
import { notifyUser } from "../../notifications/lib/notify";

/**
 * Loads a household awaiting its candidate, and checks the signed-in user is that candidate.
 *
 * The invited email is checked first. Anyone else gets one answer (`CLAIM_NOT_FOR_YOU`)
 * whether the household is missing, already claimed, has no invitation pending or was started
 * for someone else, so a stranger holding a slug or an id cannot learn which households exist
 * or where their claim stands (quality rule S1). Only the invitee hears more (verify your
 * email), and only the candidate who already confirmed the page is told it is confirmed.
 */
export async function loadClaimableHousehold(
	organizationId: string | null,
	currentUser: { id: string; email: string; emailVerified: boolean },
) {
	const household = organizationId ? await getHouseholdById(organizationId) : null;
	const page = household?.biodataProfile;
	const pendingEmail = household?.householdSetting?.pendingCandidateEmail ?? null;

	if (page?.userId && page.userId === currentUser.id) {
		// The candidate reopening their own claim link: it is their page, so nothing leaks.
		fail("CONFLICT", "ALREADY_CLAIMED");
	}
	const isInvitee =
		pendingEmail !== null && pendingEmail.toLowerCase() === currentUser.email.toLowerCase();
	if (!household || !page || page.userId || !isInvitee) {
		fail("FORBIDDEN", "CLAIM_NOT_FOR_YOU");
	}
	if (!currentUser.emailVerified) {
		fail("PRECONDITION_FAILED", "EMAIL_NOT_VERIFIED");
	}

	return { household, page };
}

export const claimPage = protectedProcedure
	.route({
		method: "POST",
		path: "/households/{organizationId}/claim",
		tags: ["Households"],
		summary: "Confirm a page a relative drafted",
		description:
			"The invited candidate becomes the owner and the drafter a guardian. 18+ and a verified email are required.",
	})
	.input(z.object({ organizationId: z.string() }))
	.output(z.object({ status: z.literal("draft") }))
	.handler(async ({ input, context: { user } }) => {
		const { household, page } = await loadClaimableHousehold(input.organizationId, user);

		if (page.dateOfBirth && ageFromDateOfBirth(page.dateOfBirth) < 18) {
			fail("PRECONDITION_FAILED", "UNDER_18");
		}
		if (await getPageByUserId(user.id)) {
			// One page per candidate.
			fail("CONFLICT", "ALREADY_CLAIMED");
		}

		const now = new Date();
		const drafterIds = household.members
			.filter((row) => row.userId !== user.id && row.role === "owner")
			.map((row) => row.userId);

		await db.transaction(async (tx) => {
			const existingMembership = household.members.find((row) => row.userId === user.id);
			if (existingMembership) {
				await tx
					.update(member)
					.set({ role: "owner" })
					.where(eq(member.id, existingMembership.id));
			} else {
				await tx.insert(member).values({
					organizationId: household.id,
					userId: user.id,
					role: "owner",
					createdAt: now,
				});
			}

			// The drafter becomes a guardian.
			await tx
				.update(member)
				.set({ role: "admin" })
				.where(
					and(
						eq(member.organizationId, household.id),
						eq(member.role, "owner"),
						ne(member.userId, user.id),
					),
				);

			await tx
				.update(biodataProfile)
				.set({
					userId: user.id,
					claimedAt: now,
					status: "draft",
					verification: "email",
					isVerified: true,
				})
				.where(eq(biodataProfile.id, page.id));

			await tx
				.update(partnerPreference)
				.set({ userId: user.id })
				.where(eq(partnerPreference.organizationId, household.id));
			await tx
				.update(wallet)
				.set({ userId: user.id })
				.where(eq(wallet.organizationId, household.id));

			await tx
				.update(householdSetting)
				.set({ pendingCandidateEmail: null, familyEditsPage: false })
				.where(eq(householdSetting.organizationId, household.id));

			await tx
				.update(invitation)
				.set({ status: "accepted" })
				.where(
					and(
						eq(invitation.organizationId, household.id),
						eq(invitation.email, user.email.toLowerCase()),
						eq(invitation.status, "pending"),
					),
				);

			await tx
				.update(userTable)
				.set({ lastActiveOrganizationId: household.id })
				.where(eq(userTable.id, user.id));
		});

		await Promise.all(
			drafterIds.map((drafterId) =>
				notifyUser({
					userId: drafterId,
					copy: "PAGE_CLAIMED",
					link: `/${household.slug}`,
					values: { name: firstNameOf(page.displayName) },
					email: true,
				}),
			),
		);

		return { status: "draft" as const };
	});
