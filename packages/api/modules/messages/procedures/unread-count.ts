import { db, message } from "@repo/database";
import { eq, and } from "drizzle-orm";

import { protectedProcedure } from "../../../orpc/procedures";

export const unreadCount = protectedProcedure
	.route({ method: "GET", path: "/messages/unread", tags: ["Messages"], summary: "Get unread message count" })
	.handler(async ({ context: { user } }) => {
		const unread = await db.query.message.findMany({
			where: and(eq(message.toUserId, user.id), eq(message.read, false)),
			columns: { id: true },
		});
		return { count: unread.length };
	});
