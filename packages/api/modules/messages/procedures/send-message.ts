import { db, message, interest } from "@repo/database";
import { eq, and, or } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const sendMessage = protectedProcedure
	.route({ method: "POST", path: "/messages", tags: ["Messages"], summary: "Send a message to a match" })
	.input(z.object({ toUserId: z.string(), content: z.string().min(1).max(2000) }))
	.handler(async ({ context: { user }, input }) => {
		// Verify they're matched (both accepted)
		const sent = await db.query.interest.findFirst({
			where: and(eq(interest.fromUserId, user.id), eq(interest.toUserId, input.toUserId), eq(interest.status, "accepted")),
		});
		const received = await db.query.interest.findFirst({
			where: and(eq(interest.fromUserId, input.toUserId), eq(interest.toUserId, user.id), eq(interest.status, "accepted")),
		});
		if (!sent || !received) throw new Error("You can only message mutual matches");

		const [msg] = await db.insert(message).values({
			fromUserId: user.id,
			toUserId: input.toUserId,
			content: input.content,
		}).returning();
		return msg;
	});
