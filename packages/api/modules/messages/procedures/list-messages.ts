import { db, message } from "@repo/database";
import { eq, and, or, asc } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const listMessages = protectedProcedure
	.route({ method: "GET", path: "/messages", tags: ["Messages"], summary: "Get conversation with a user" })
	.input(z.object({ withUserId: z.string() }))
	.handler(async ({ context: { user }, input }) => {
		return await db.query.message.findMany({
			where: or(
				and(eq(message.fromUserId, user.id), eq(message.toUserId, input.withUserId)),
				and(eq(message.fromUserId, input.withUserId), eq(message.toUserId, user.id)),
			),
			orderBy: [asc(message.createdAt)],
		});
	});
