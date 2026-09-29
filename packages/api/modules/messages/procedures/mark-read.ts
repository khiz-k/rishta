import { db, getMatchById, message } from "@repo/database";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { assertParticipant } from "../../matches/lib/view";

export const markRead = protectedProcedure
	.route({
		method: "POST",
		path: "/messages/read",
		tags: ["Messages"],
		summary: "Mark an introduction's messages as read",
	})
	.input(z.object({ matchId: z.string() }))
	.output(z.object({ success: z.literal(true) }))
	.handler(async ({ input, context: { user } }) => {
		const match = await getMatchById(input.matchId);
		assertParticipant(match, user.id);
		await db
			.update(message)
			.set({ read: true })
			.where(
				and(
					eq(message.matchId, match.id),
					eq(message.toUserId, user.id),
					eq(message.read, false),
				),
			);
		return { success: true as const };
	});
