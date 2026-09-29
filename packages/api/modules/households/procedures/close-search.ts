import { biodataProfile, BIODATA_STATUSES, db } from "@repo/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getServerCopy } from "../../../lib/copy";
import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { closeSearchForHousehold } from "../lib/close-search";
import { requireCandidate } from "../lib/context";

export const closeSearch = protectedProcedure
	.route({
		method: "POST",
		path: "/households/{organizationId}/close",
		tags: ["Households"],
		summary: "Close my search",
		description:
			"Taking a break pauses the page. Engaged or something else closes it kindly, in one transaction.",
	})
	.input(
		z.object({
			organizationId: z.string(),
			reason: z.enum(["engaged", "break", "other"]),
			closingNote: z.string().trim().min(20).max(400).optional(),
		}),
	)
	.output(
		z.object({
			status: z.enum(BIODATA_STATUSES),
			lettersAnswered: z.number().int(),
			notesTakenBack: z.number().int(),
			introductionsClosed: z.number().int(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const context = await requireCandidate(input.organizationId, user.id);
		if (context.page.status === "closed") {
			fail("CONFLICT", "PAGE_CLOSED");
		}

		if (input.reason === "break") {
			// Letters and introductions stay open; the page leaves every folio.
			await db
				.update(biodataProfile)
				.set({
					status: "paused",
					isActive: false,
					pausedAt: new Date(),
					closedReason: "break",
				})
				.where(eq(biodataProfile.organizationId, input.organizationId));
			return {
				status: "paused" as const,
				lettersAnswered: 0,
				notesTakenBack: 0,
				introductionsClosed: 0,
			};
		}

		const t = await getServerCopy(user.locale);
		const result = await closeSearchForHousehold({
			organizationId: input.organizationId,
			candidateUserId: user.id,
			reason: input.reason,
			closingNote: input.closingNote ?? t("defaults.searchClosedNote"),
		});

		return {
			status: "closed" as const,
			lettersAnswered: result.declinedLetterIds.length,
			notesTakenBack: result.withdrawnLetterIds.length,
			introductionsClosed: result.closedMatches.length,
		};
	});
