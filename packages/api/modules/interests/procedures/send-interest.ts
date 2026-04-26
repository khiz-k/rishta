import { db, interest, purchase, wallet } from "@repo/database";
import { eq, and, gte, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

const FREE_DAILY_LIMIT = 3;

export const sendInterest = protectedProcedure
	.route({
		method: "POST",
		path: "/interests",
		tags: ["Interests"],
		summary: "Send interest to a profile, optionally with a bid",
	})
	.input(
		z.object({
			toUserId: z.string(),
			message: z.string().optional(),
			bidAmount: z.number().int().min(0).max(100).optional(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const bid = input.bidAmount || 0;

		// Daily interest limit: 3/day for free users
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const todaysInterests = await db.query.interest.findMany({
			where: and(eq(interest.fromUserId, user.id), gte(interest.createdAt, today)),
		});

		const hasPremium = await db.query.purchase.findFirst({
			where: and(eq(purchase.userId, user.id), eq(purchase.status, "active")),
		});

		if (!hasPremium && todaysInterests.length >= FREE_DAILY_LIMIT) {
			throw new Error(`Daily limit reached (${FREE_DAILY_LIMIT}/day). Upgrade to Vow Premium for unlimited interests.`);
		}

		// If bidding, deduct credits from wallet
		if (bid > 0) {
			let w = await db.query.wallet.findFirst({
				where: eq(wallet.userId, user.id),
			});

			if (!w) {
				const [created] = await db.insert(wallet).values({ userId: user.id, credits: 10 }).returning();
				w = created;
			}

			if (!w || w.credits < bid) {
				throw new Error(`Not enough credits. You have ${w?.credits || 0}, bid requires ${bid}.`);
			}

			// Deduct credits
			await db.update(wallet).set({
				credits: sql`${wallet.credits} - ${bid}`,
				totalSpent: sql`${wallet.totalSpent} + ${bid}`,
			}).where(eq(wallet.userId, user.id));
		}

		const [created] = await db
			.insert(interest)
			.values({
				fromUserId: user.id,
				toUserId: input.toUserId,
				message: input.message,
				status: "pending",
				bidAmount: bid,
			})
			.onConflictDoNothing()
			.returning();

		return created ?? { alreadySent: true };
	});
