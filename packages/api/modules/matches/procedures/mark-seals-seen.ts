import { db, getMatchById, match as matchTable } from "@repo/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { assertParticipant } from "../lib/view";

/** The break plays once per side; this records that it has. */
export const markSealsSeen = protectedProcedure
	.route({
		method: "POST",
		path: "/matches/{matchId}/seals-seen",
		tags: ["Introductions"],
		summary: "Record that the seals were seen broken",
	})
	.input(z.object({ matchId: z.string() }))
	.output(z.object({ seenAt: z.string() }))
	.handler(async ({ input, context: { user } }) => {
		const match = await getMatchById(input.matchId);
		assertParticipant(match, user.id);
		const isA = match.userAId === user.id;
		const already = isA ? match.sealsSeenByAAt : match.sealsSeenByBAt;
		if (already) {
			return { seenAt: already.toISOString() };
		}
		const seenAt = new Date();
		await db
			.update(matchTable)
			.set(isA ? { sealsSeenByAAt: seenAt } : { sealsSeenByBAt: seenAt })
			.where(eq(matchTable.id, match.id));
		return { seenAt: seenAt.toISOString() };
	});
