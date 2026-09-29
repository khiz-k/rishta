import { getMatchById, isBlockedEitherWay, listMessagesForMatch } from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { SafetyFlagSchema } from "../../biodata/types";
import { assertParticipant } from "../../matches/lib/view";

const PAGE_SIZE = 50;

export const MessageSchema = z.object({
	id: z.string(),
	fromMe: z.boolean(),
	content: z.string(),
	read: z.boolean(),
	createdAt: z.string(),
	/** Shown to the recipient only, never to the sender. */
	safetyFlag: SafetyFlagSchema.nullable(),
});

export const listMessages = protectedProcedure
	.route({
		method: "GET",
		path: "/messages",
		tags: ["Messages"],
		summary: "Correspondence in an introduction",
		description:
			"Oldest first within a page; pass the cursor to read further back. Polled every 3 seconds while open.",
	})
	.input(z.object({ matchId: z.string(), cursor: z.iso.datetime().optional() }))
	.output(z.object({ items: z.array(MessageSchema), nextCursor: z.string().nullable() }))
	.handler(async ({ input, context: { user } }) => {
		const match = await getMatchById(input.matchId);
		assertParticipant(match, user.id);
		const otherUserId = match.userAId === user.id ? match.userBId : match.userAId;
		if (await isBlockedEitherWay(user.id, otherUserId)) {
			fail("NOT_FOUND", "MATCH_NOT_FOUND");
		}

		const { items, hasMore } = await listMessagesForMatch({
			matchId: match.id,
			before: input.cursor ? new Date(input.cursor) : undefined,
			limit: PAGE_SIZE,
		});
		const oldest = items[0];

		return {
			items: items.map((message) => ({
				id: message.id,
				fromMe: message.fromUserId === user.id,
				content: message.content,
				read: message.read,
				createdAt: message.createdAt.toISOString(),
				safetyFlag: message.toUserId === user.id ? message.safetyFlag : null,
			})),
			nextCursor: hasMore && oldest ? oldest.createdAt.toISOString() : null,
		};
	});
