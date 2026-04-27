import { db, interest } from "@repo/database";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const getProfileStats = protectedProcedure
	.route({ method: "GET", path: "/interests/stats", tags: ["Interests"], summary: "Get interest stats for a profile" })
	.input(z.object({ profileUserId: z.string() }))
	.handler(async ({ context: { user }, input }) => {
		const interests = await db.query.interest.findMany({
			where: and(eq(interest.toUserId, input.profileUserId), eq(interest.status, "pending")),
			columns: { bidAmount: true, fromUserId: true },
			orderBy: [desc(interest.bidAmount)],
		});

		const totalInterested = interests.length;
		const topBid = interests[0]?.bidAmount || 0;

		// Find current user's bid rank (if they already sent interest)
		const myInterest = interests.find((i) => i.fromUserId === user.id);
		const myRank = myInterest
			? interests.filter((i) => i.bidAmount > (myInterest.bidAmount || 0)).length + 1
			: null;

		return { totalInterested, topBid, myRank, myBid: myInterest?.bidAmount || 0 };
	});
