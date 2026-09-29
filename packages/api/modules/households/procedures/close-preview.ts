import { db, interest, match } from "@repo/database";
import { and, eq, ne, or, sql } from "drizzle-orm";
import { z } from "zod";

import { getServerCopy } from "../../../lib/copy";
import { protectedProcedure } from "../../../orpc/procedures";
import { requireCandidate } from "../lib/context";

/** "What happens next": the counts shown before closing a search (design.md §5.12). */
export const closePreview = protectedProcedure
	.route({
		method: "GET",
		path: "/households/{organizationId}/close-preview",
		tags: ["Households"],
		summary: "Preview what closing my search will do",
	})
	.input(z.object({ organizationId: z.string() }))
	.output(
		z.object({
			waitingLetters: z.number().int(),
			sealedNotes: z.number().int(),
			openIntroductions: z.number().int(),
			defaultClosingNote: z.string(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		await requireCandidate(input.organizationId, user.id);

		const count = sql<number>`count(*)`;
		const [[waiting], [sealed], [introductions], t] = await Promise.all([
			db
				.select({ count })
				.from(interest)
				.where(and(eq(interest.toUserId, user.id), eq(interest.status, "pending"))),
			db
				.select({ count })
				.from(interest)
				.where(and(eq(interest.fromUserId, user.id), eq(interest.status, "pending"))),
			db
				.select({ count })
				.from(match)
				.where(
					and(
						ne(match.stage, "closed"),
						or(eq(match.userAId, user.id), eq(match.userBId, user.id)),
					),
				),
			getServerCopy(user.locale),
		]);

		return {
			waitingLetters: Number(waiting?.count ?? 0),
			sealedNotes: Number(sealed?.count ?? 0),
			openIntroductions: Number(introductions?.count ?? 0),
			defaultClosingNote: t("defaults.searchClosedNote"),
		};
	});
