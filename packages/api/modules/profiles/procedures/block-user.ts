import { db, blockUser } from "@repo/database";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const blockUserProcedure = protectedProcedure
	.route({ method: "POST", path: "/profiles/block", tags: ["Profiles"], summary: "Block/unblock a user" })
	.input(z.object({ blockedUserId: z.string(), reason: z.string().optional() }))
	.handler(async ({ context: { user }, input }) => {
		const existing = await db.query.blockUser.findFirst({
			where: and(eq(blockUser.blockerUserId, user.id), eq(blockUser.blockedUserId, input.blockedUserId)),
		});

		if (existing) {
			await db.delete(blockUser).where(eq(blockUser.id, existing.id));
			return { blocked: false };
		}

		await db.insert(blockUser).values({
			blockerUserId: user.id,
			blockedUserId: input.blockedUserId,
			reason: input.reason,
		});
		return { blocked: true };
	});
