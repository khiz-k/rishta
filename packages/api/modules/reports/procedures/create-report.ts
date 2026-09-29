import {
	createReport,
	db,
	getFamilyLinkById,
	getLetterById,
	getPageById,
	getPageByUserId,
	message,
	REPORT_CATEGORIES,
	REPORT_CONTEXTS,
} from "@repo/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import {
	getHouseholdContext,
	getHouseholdRow,
	type HouseholdContext,
} from "../../households/lib/context";
import { loadPageForViewer } from "../../profiles/lib/viewer";
import { blockCandidate } from "../../profiles/procedures/block-user";

/**
 * Resolves who and which page a report is about, checking the reporter could see it. Anything
 * the reporter could not see answers exactly like something that does not exist.
 */
async function resolveReported(params: {
	context: (typeof REPORT_CONTEXTS)[number];
	contextId: string;
	userId: string;
	household: HouseholdContext | null;
}) {
	switch (params.context) {
		case "page": {
			// A page is reported from a household reading it: the same rules as opening it
			// (blocks, claim, status, folio access), so a handle's existence never leaks.
			if (!params.household) {
				return null;
			}
			const { page } = await loadPageForViewer(params.household, params.contextId);
			return { userId: page.userId, profileId: page.id };
		}
		case "letter": {
			const letter = await getLetterById(params.contextId);
			if (
				!letter ||
				(letter.fromUserId !== params.userId && letter.toUserId !== params.userId)
			) {
				return null;
			}
			const otherUserId =
				letter.fromUserId === params.userId ? letter.toUserId : letter.fromUserId;
			const page = await getPageByUserId(otherUserId);
			return { userId: otherUserId, profileId: page?.id ?? null };
		}
		case "message": {
			const row = await db.query.message.findFirst({
				where: eq(message.id, params.contextId),
			});
			if (!row || row.toUserId !== params.userId) {
				return null;
			}
			const page = await getPageByUserId(row.fromUserId);
			return { userId: row.fromUserId, profileId: page?.id ?? null };
		}
		case "family_link": {
			// Signed-in reports come from the household that made the link; relatives without an
			// account report through `familyLinks.report` with the token instead.
			const { row: link } = await getHouseholdRow(
				await getFamilyLinkById(params.contextId),
				params.userId,
				"REPORT_CONTEXT_NOT_FOUND",
			);
			const page = await getPageById(link.profileId);
			return { userId: page?.userId ?? null, profileId: link.profileId };
		}
	}
}

export const createReportProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/reports",
		tags: ["Reports"],
		summary: "Report a page, letter, message or family link",
		description: 'The reporter is never revealed. "Also block them" applies for the candidate.',
	})
	.input(
		z.object({
			context: z.enum(REPORT_CONTEXTS),
			contextId: z.string().min(1),
			category: z.enum(REPORT_CATEGORIES),
			details: z.string().trim().max(2000).optional(),
			alsoBlock: z.boolean().default(true),
			organizationId: z.string().optional(),
		}),
	)
	.output(z.object({ reportId: z.string() }))
	.handler(async ({ input, context: { user } }) => {
		const household = input.organizationId
			? await getHouseholdContext(input.organizationId, user.id)
			: null;
		const reported = await resolveReported({
			context: input.context,
			contextId: input.contextId,
			userId: user.id,
			household,
		});
		if (!reported) {
			fail("NOT_FOUND", "REPORT_CONTEXT_NOT_FOUND");
		}

		const created = await createReport({
			reporterUserId: user.id,
			reportedUserId: reported.userId,
			reportedProfileId: reported.profileId,
			category: input.category,
			context: input.context,
			contextId: input.contextId,
			details: input.details ?? null,
		});
		if (!created) {
			fail("INTERNAL_SERVER_ERROR", "REPORT_NOT_FOUND");
		}

		// Only the candidate blocks; guardians and family can report.
		if (input.alsoBlock && household && reported.userId && reported.userId !== user.id) {
			if (household.role === "owner" && household.isCandidate) {
				await blockCandidate({
					organizationId: household.organizationId,
					blockerUserId: user.id,
					blockedUserId: reported.userId,
					reason: `report:${input.category}`,
				});
			}
		}

		return { reportId: created.id };
	});
