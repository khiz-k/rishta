import { randomInt } from "node:crypto";

import { auth } from "@repo/auth";
import {
	BIODATA_STATUSES,
	biodataProfile,
	CANDIDATE_RELATIONS,
	db,
	ensureHouseholdWallet,
	generateHandle,
	getPageByUserId,
	householdSetting,
	isHandleTaken,
	member,
	organization,
	user as userTable,
	type CandidateRelation,
	type Gender,
	type PageAuthor,
} from "@repo/database";
import { logger } from "@repo/logs";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { timeZoneSchema } from "../../profiles/lib/sections";
import { generateHouseholdSlug } from "../lib/slug";

const GENDER_FOR_RELATION: Partial<Record<CandidateRelation, Gender>> = {
	son: "male",
	brother: "male",
	daughter: "female",
	sister: "female",
};

const AUTHOR_FOR_RELATION: Record<CandidateRelation, PageAuthor> = {
	self: "self",
	son: "parent",
	daughter: "parent",
	brother: "sibling",
	sister: "sibling",
	relative: "relative",
};

export async function generateUniqueHandle() {
	for (let attempt = 0; attempt < 8; attempt++) {
		const handle = generateHandle(randomInt);
		if (!(await isHandleTaken(handle))) {
			return handle;
		}
	}
	throw new Error("Could not allocate a page handle");
}

/** Invites the candidate to claim a page a relative drafted (a Better Auth invitation). */
export async function inviteCandidateToHousehold(params: {
	headers: Headers;
	organizationId: string;
	email: string;
}) {
	try {
		const invitation = await auth.api.createInvitation({
			headers: params.headers,
			body: { email: params.email, role: "member", organizationId: params.organizationId },
		});
		return invitation?.id ?? null;
	} catch (error) {
		// The pending email is recorded either way; the invitation can be sent again.
		logger.error(error, { ctx: "inviteCandidateToHousehold" });
		return null;
	}
}

export const createHousehold = protectedProcedure
	.route({
		method: "POST",
		path: "/households",
		tags: ["Households"],
		summary: "Create a household and its draft page",
		description:
			'"Who is this page for?": creates the household, its settings, a draft page and the wallet.',
	})
	.input(
		z.object({
			candidateRelation: z.enum(CANDIDATE_RELATIONS),
			candidateFirstName: z.string().trim().min(1).max(40),
			candidateEmail: z.email().optional(),
			timeZone: timeZoneSchema,
		}),
	)
	.output(
		z.object({
			organizationId: z.string(),
			slug: z.string(),
			handle: z.string(),
			status: z.enum(BIODATA_STATUSES),
		}),
	)
	.handler(async ({ input, context: { user, headers } }) => {
		const isSelf = input.candidateRelation === "self";

		if (isSelf) {
			// One page per candidate: "Me" twice returns the existing household.
			const existing = await getPageByUserId(user.id);
			if (existing) {
				const org = await db.query.organization.findFirst({
					where: eq(organization.id, existing.organizationId),
				});
				if (!org) {
					fail("CONFLICT", "ALREADY_CLAIMED");
				}
				return {
					organizationId: org.id,
					slug: org.slug,
					handle: existing.handle,
					status: existing.status,
				};
			}
		}

		const candidateEmail = isSelf ? null : (input.candidateEmail?.toLowerCase() ?? null);
		const [slug, handle] = await Promise.all([
			generateHouseholdSlug(input.candidateFirstName),
			generateUniqueHandle(),
		]);
		const now = new Date();
		const status = isSelf ? "draft" : candidateEmail ? "awaiting_claim" : "draft";

		const organizationId = await db.transaction(async (tx) => {
			const [org] = await tx
				.insert(organization)
				.values({ name: input.candidateFirstName, slug, createdAt: now })
				.returning({ id: organization.id });

			if (!org) {
				throw new Error("Could not create household");
			}

			await tx.insert(member).values({
				organizationId: org.id,
				userId: user.id,
				role: "owner",
				createdAt: now,
			});

			await tx.insert(householdSetting).values({
				organizationId: org.id,
				candidateRelation: input.candidateRelation,
				pendingCandidateEmail: candidateEmail,
				// A relative drafting the page edits it until the candidate claims it.
				familyEditsPage: !isSelf,
			});

			await tx.insert(biodataProfile).values({
				organizationId: org.id,
				userId: isSelf ? user.id : null,
				handle,
				status,
				displayName: input.candidateFirstName,
				gender: GENDER_FOR_RELATION[input.candidateRelation] ?? null,
				createdBy: AUTHOR_FOR_RELATION[input.candidateRelation],
				timeZone: input.timeZone,
				claimedAt: isSelf ? now : null,
				verification: isSelf && user.emailVerified ? "email" : "none",
				isVerified: isSelf && user.emailVerified,
			});

			await ensureHouseholdWallet(org.id, { userId: user.id, executor: tx });

			await tx
				.update(userTable)
				.set({ lastActiveOrganizationId: org.id })
				.where(eq(userTable.id, user.id));

			return org.id;
		});

		if (candidateEmail) {
			await inviteCandidateToHousehold({ headers, organizationId, email: candidateEmail });
		}

		return { organizationId, slug, handle, status };
	});
