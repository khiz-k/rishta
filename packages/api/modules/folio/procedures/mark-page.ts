import {
	db,
	FOLIO_PAGE_STATES,
	folioPage,
	getFolioPageById,
	getPageById,
	PASS_REASONS,
	shortlist,
} from "@repo/database";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { canReadFolio, getHouseholdRow, type HouseholdContext } from "../../households/lib/context";
import { trackPageRead } from "../../profiles/procedures/track-read";

function assertCandidate(context: HouseholdContext) {
	if (context.role !== "owner" || !context.isCandidate) {
		fail("FORBIDDEN", "CANDIDATE_ONLY");
	}
}

function assertKeeper(context: HouseholdContext) {
	// "Keep for Priya": the candidate or a guardian; family members pencil notes instead.
	if (context.role === "member") {
		fail("FORBIDDEN", "ROLE_NOT_ALLOWED");
	}
}

export const markFolioPage = protectedProcedure
	.route({
		method: "POST",
		path: "/folio/pages/{folioPageId}/mark",
		tags: ["Folio"],
		summary: "Read, keep, pass or undo a folio page",
		description:
			"A turn never answers a page. Keep: candidate or guardian. Pass: candidate only. Undo returns the page to read.",
	})
	.input(
		z.object({
			folioPageId: z.string(),
			state: z.enum(["read", "kept", "passed", "unread"]),
			passReason: z.enum(PASS_REASONS).optional(),
		}),
	)
	.output(z.object({ state: z.enum(FOLIO_PAGE_STATES) }))
	.handler(async ({ input, context: { user } }) => {
		const { row, context } = await getHouseholdRow(
			await getFolioPageById(input.folioPageId),
			user.id,
			"FOLIO_PAGE_NOT_FOUND",
		);
		if (!canReadFolio(context)) {
			fail("FORBIDDEN", "ROLE_NOT_ALLOWED");
		}
		const target = await getPageById(row.profileId);
		if (!target?.userId || target.status !== "active") {
			fail("NOT_FOUND", "PAGE_UNAVAILABLE");
		}
		const candidateUserId = context.page?.userId;
		const now = new Date();

		const setState = async (
			state: (typeof FOLIO_PAGE_STATES)[number],
			extra: Partial<typeof folioPage.$inferInsert> = {},
		) => {
			await db
				.update(folioPage)
				.set({ state, ...extra })
				.where(eq(folioPage.id, row.id));
			return { state };
		};

		switch (input.state) {
			case "read": {
				// Opening a page records a read unless the household reads privately.
				// Recording the read is best-effort; opening a page never fails because of it.
				await trackPageRead({
					organizationId: row.organizationId,
					userId: user.id,
					handle: target.handle,
				}).catch(() => false);
				if (row.state === "unread") {
					return setState("read");
				}
				return { state: row.state };
			}
			case "kept": {
				assertKeeper(context);
				if (!candidateUserId) {
					fail("PRECONDITION_FAILED", "PAGE_AWAITING_CLAIM");
				}
				await db
					.insert(shortlist)
					.values({
						organizationId: row.organizationId,
						userId: candidateUserId,
						profileUserId: target.userId,
						keptByUserId: user.id,
					})
					.onConflictDoNothing();
				return setState("kept", { answeredAt: now, passReason: null });
			}
			case "passed": {
				assertCandidate(context);
				await db
					.delete(shortlist)
					.where(
						and(
							eq(shortlist.organizationId, row.organizationId),
							eq(shortlist.profileUserId, target.userId),
						),
					);
				return setState("passed", {
					answeredAt: now,
					passReason: input.passReason ?? null,
				});
			}
			case "unread": {
				// Undo: a pass (candidate only) or a keep (candidate or guardian).
				if (row.state === "passed") {
					assertCandidate(context);
				} else if (row.state === "kept") {
					assertKeeper(context);
					await db
						.delete(shortlist)
						.where(
							and(
								eq(shortlist.organizationId, row.organizationId),
								eq(shortlist.profileUserId, target.userId),
							),
						);
				} else {
					return { state: row.state };
				}
				return setState("read", { answeredAt: null, passReason: null });
			}
		}
	});
