import {
	countMessagesInMatch,
	db,
	getMatchById,
	isBlockedEitherWay,
	match as matchTable,
	message,
} from "@repo/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { screenText } from "../../ai/lib/safety";
import { assertParticipant } from "../../matches/lib/view";
import { MessageSchema } from "./list-messages";

export const sendMessage = protectedProcedure
	.route({
		method: "POST",
		path: "/messages",
		tags: ["Messages"],
		summary: "Write in an introduction",
		description:
			"Gated on an open introduction (one accepted letter is enough). Screened for safety; never blocked.",
	})
	.input(z.object({ matchId: z.string(), content: z.string().trim().min(1).max(2000) }))
	.output(MessageSchema)
	.handler(async ({ input, context: { user } }) => {
		const match = await getMatchById(input.matchId);
		assertParticipant(match, user.id);
		if (match.stage === "closed") {
			fail("CONFLICT", "MATCH_CLOSED");
		}
		const otherUserId = match.userAId === user.id ? match.userBId : match.userAId;
		if (await isBlockedEitherWay(user.id, otherUserId)) {
			fail("NOT_FOUND", "MATCH_NOT_FOUND");
		}

		const messageIndex = await countMessagesInMatch(match.id);
		const safetyFlag = await screenText(input.content, { kind: "message", messageIndex });
		const now = new Date();

		const created = await db.transaction(async (tx) => {
			const [row] = await tx
				.insert(message)
				.values({
					matchId: match.id,
					fromUserId: user.id,
					toUserId: otherUserId,
					content: input.content,
					safetyFlag,
					createdAt: now,
				})
				.returning();
			await tx
				.update(matchTable)
				.set({ lastMessageAt: now })
				.where(eq(matchTable.id, match.id));
			return row;
		});
		if (!created) {
			fail("INTERNAL_SERVER_ERROR", "MATCH_NOT_FOUND");
		}

		return {
			id: created.id,
			fromMe: true,
			content: created.content,
			read: created.read,
			createdAt: created.createdAt.toISOString(),
			safetyFlag: null,
		};
	});
