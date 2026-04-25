import { db, interest, biodataProfile, user as userTable } from "@repo/database";
import { eq, and, or, desc } from "drizzle-orm";

import { protectedProcedure } from "../../../orpc/procedures";

export const listMatches = protectedProcedure
	.route({
		method: "GET",
		path: "/interests/matches",
		tags: ["Interests"],
		summary: "List mutual matches (both accepted)",
	})
	.handler(async ({ context: { user } }) => {
		// Find all interests where I accepted someone AND they accepted me
		const myAccepted = await db.query.interest.findMany({
			where: and(eq(interest.fromUserId, user.id), eq(interest.status, "accepted")),
		});

		const theirAccepted = await db.query.interest.findMany({
			where: and(eq(interest.toUserId, user.id), eq(interest.status, "accepted")),
		});

		// Mutual: I sent & they accepted, AND they sent & I accepted
		const iAcceptedFrom = new Set(theirAccepted.map((i) => i.fromUserId));
		const theyAcceptedMine = new Set(myAccepted.map((i) => i.toUserId));

		const mutualUserIds = [...iAcceptedFrom].filter((id) => theyAcceptedMine.has(id));

		if (mutualUserIds.length === 0) return [];

		// Get profiles + contact info for matches
		const profiles = await db.query.biodataProfile.findMany({
			where: (bp, { inArray }) => inArray(bp.userId, mutualUserIds),
		});

		const users = await db.query.user.findMany({
			where: (u, { inArray }) => inArray(u.id, mutualUserIds),
			columns: { id: true, name: true, email: true },
		});

		const userMap = new Map(users.map((u) => [u.id, u]));

		return profiles.map((p) => ({
			...p,
			contactEmail: userMap.get(p.userId)?.email,
			contactName: userMap.get(p.userId)?.name,
		}));
	});
