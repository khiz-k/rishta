import { db, interest } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const sendInterest = protectedProcedure
	.route({
		method: "POST",
		path: "/interests",
		tags: ["Interests"],
		summary: "Send interest to a profile",
	})
	.input(
		z.object({
			toUserId: z.string(),
			message: z.string().optional(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const [created] = await db
			.insert(interest)
			.values({
				fromUserId: user.id,
				toUserId: input.toUserId,
				message: input.message,
				status: "pending",
			})
			.onConflictDoNothing()
			.returning();

		return created ?? { alreadySent: true };
	});
