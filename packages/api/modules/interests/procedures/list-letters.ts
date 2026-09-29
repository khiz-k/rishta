import { closeExpiredLetters, getLettersForOrganization } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { LetterSummarySchema } from "../../biodata/types";
import { getHouseholdContext, isCandidateReader } from "../../households/lib/context";
import { boxFor, LETTER_BOXES, sortBox, summarizeLetters } from "../lib/load";

export const listLetters = protectedProcedure
	.route({
		method: "GET",
		path: "/interests",
		tags: ["Letters"],
		summary: "Letters, by box",
		description:
			"Waiting for your answer (oldest first, priority notes pinned), Introductions, Your sealed notes, Closed. Family sees stage lines only, and only if the candidate allows it.",
	})
	.input(z.object({ organizationId: z.string(), box: z.enum(LETTER_BOXES) }))
	.output(z.array(LetterSummarySchema))
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		const candidateUserId = context.page?.userId;
		if (!candidateUserId) {
			return [];
		}

		const isCandidate = isCandidateReader(context);
		// "Priya's letters are private to her." Stage lines only, if she allows them.
		if (
			!isCandidate &&
			!(input.box === "introductions" && context.settings.familySeesIntroductions)
		) {
			return [];
		}

		await closeExpiredLetters(input.organizationId);
		const letters = (await getLettersForOrganization(input.organizationId)).filter(
			(letter) => boxFor(letter, candidateUserId) === input.box,
		);

		const summaries = await summarizeLetters({
			letters,
			candidateUserId,
			organizationId: input.organizationId,
			stageLineOnly: !isCandidate,
		});
		return sortBox(input.box, summaries);
	});
