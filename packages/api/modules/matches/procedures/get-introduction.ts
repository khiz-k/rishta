import { getMatchById, isBlockedEitherWay } from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { assertParticipant, buildIntroductionView } from "../lib/view";
import { IntroductionViewSchema } from "../types";

export const getIntroduction = protectedProcedure
	.route({
		method: "GET",
		path: "/matches/{matchId}",
		tags: ["Introductions"],
		summary: "Open an introduction",
		description:
			"Both sealed sections open to each other, contact as each chose to share, and the proposed evenings.",
	})
	.input(z.object({ matchId: z.string() }))
	.output(IntroductionViewSchema)
	.handler(async ({ input, context: { user } }) => {
		const match = await getMatchById(input.matchId);
		assertParticipant(match, user.id);
		const otherUserId = match.userAId === user.id ? match.userBId : match.userAId;
		if (await isBlockedEitherWay(user.id, otherUserId)) {
			fail("NOT_FOUND", "MATCH_NOT_FOUND");
		}
		return buildIntroductionView(match, user.id);
	});
