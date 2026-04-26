import { db, interest, purchase } from "@repo/database";
import { eq, and, gte } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

const FREE_DAILY_LIMIT = 3;

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
		// Daily interest limit: 3/day for free users
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const todaysInterests = await db.query.interest.findMany({
			where: and(eq(interest.fromUserId, user.id), gte(interest.createdAt, today)),
		});

		// Check if user has premium (any active purchase)
		const hasPremium = await db.query.purchase.findFirst({
			where: and(eq(purchase.userId, user.id), eq(purchase.status, "active")),
		});

		if (!hasPremium && todaysInterests.length >= FREE_DAILY_LIMIT) {
			throw new Error(`Daily limit reached (${FREE_DAILY_LIMIT}/day). Upgrade to Vow Premium for unlimited interests.`);
		}

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
