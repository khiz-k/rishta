import { db, wallet } from "@repo/database";
import { eq } from "drizzle-orm";

import { protectedProcedure } from "../../../orpc/procedures";

export const getWallet = protectedProcedure
	.route({ method: "GET", path: "/wallet", tags: ["Wallet"], summary: "Get or create wallet" })
	.handler(async ({ context: { user } }) => {
		let w = await db.query.wallet.findFirst({
			where: eq(wallet.userId, user.id),
		});

		// Auto-create wallet with 10 free credits for new users
		if (!w) {
			const [created] = await db.insert(wallet).values({
				userId: user.id,
				credits: 10,
			}).returning();
			w = created;
		}

		return w;
	});
