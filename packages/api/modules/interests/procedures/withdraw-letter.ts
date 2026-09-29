import { db, getLetterById, interest } from "@repo/database";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { LetterSummarySchema } from "../../biodata/types";
import { requireCandidate } from "../../households/lib/context";
import { summarizeLetters } from "../lib/load";

export const withdrawLetter = protectedProcedure
	.route({
		method: "POST",
		path: "/interests/{letterId}/withdraw",
		tags: ["Letters"],
		summary: "Take back a pending note",
	})
	.input(z.object({ letterId: z.string() }))
	.output(LetterSummarySchema)
	.handler(async ({ input, context: { user } }) => {
		const letter = await getLetterById(input.letterId);
		if (!letter || letter.fromUserId !== user.id) {
			fail("NOT_FOUND", "LETTER_NOT_FOUND");
		}
		await requireCandidate(letter.fromOrganizationId, user.id);

		const [updated] = await db
			.update(interest)
			.set({ status: "withdrawn", closedAt: new Date() })
			.where(and(eq(interest.id, letter.id), eq(interest.status, "pending")))
			.returning();
		if (!updated) {
			fail("CONFLICT", "LETTER_NOT_PENDING");
		}

		const [summary] = await summarizeLetters({
			letters: [{ ...updated, match: null }],
			candidateUserId: user.id,
			organizationId: letter.fromOrganizationId,
		});
		if (!summary) {
			fail("NOT_FOUND", "LETTER_NOT_FOUND");
		}
		return summary;
	});
