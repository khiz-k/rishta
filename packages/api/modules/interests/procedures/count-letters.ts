import { closeExpiredLetters, getLettersForOrganization } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { getHouseholdContext } from "../../households/lib/context";
import { boxFor, summarizeLetters } from "../lib/load";

/** The masthead number: letters waiting for an answer plus introductions waiting on your move. */
export const countLetters = protectedProcedure
	.route({
		method: "GET",
		path: "/interests/counts",
		tags: ["Letters"],
		summary: "Letters waiting on the candidate",
	})
	.input(z.object({ organizationId: z.string() }))
	.output(z.object({ waiting: z.number().int(), yourMove: z.number().int() }))
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		const candidateUserId = context.page?.userId;
		if (!context.isCandidate || !candidateUserId) {
			return { waiting: 0, yourMove: 0 };
		}

		await closeExpiredLetters(input.organizationId);
		const letters = (await getLettersForOrganization(input.organizationId)).filter((letter) => {
			const box = boxFor(letter, candidateUserId);
			return box === "waiting" || box === "introductions";
		});
		const summaries = await summarizeLetters({
			letters,
			candidateUserId,
			organizationId: input.organizationId,
		});

		return {
			waiting: summaries.filter((summary) => summary.state === "waiting_for_you").length,
			yourMove: summaries.filter((summary) => summary.introduction?.yourMove).length,
		};
	});
