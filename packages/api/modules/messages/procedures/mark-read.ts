import { db, message } from "@repo/database";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const markRead = protectedProcedure
	.route({ method: "POST", path: "/messages/read", tags: ["Messages"], summary: "Mark messages as read" })
	.input(z.object({ fromUserId: z.string() }))
	.handler(async ({ context: { user }, input }) => {
		await db
			.update(message)
			.set({ read: true })
			.where(and(eq(message.fromUserId, input.fromUserId), eq(message.toUserId, user.id), eq(message.read, false)));
		return { success: true };
	});
