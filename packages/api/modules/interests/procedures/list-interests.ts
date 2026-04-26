import { db, interest, biodataProfile } from "@repo/database";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const listInterests = protectedProcedure
	.route({
		method: "GET",
		path: "/interests",
		tags: ["Interests"],
		summary: "List sent and received interests",
	})
	.input(z.object({ type: z.enum(["sent", "received"]) }))
	.handler(async ({ context: { user }, input }) => {
		if (input.type === "sent") {
			const results = await db.query.interest.findMany({
				where: eq(interest.fromUserId, user.id),
				orderBy: [desc(interest.createdAt)],
			});
			// Get profiles for each toUserId
			const profileIds = results.map((r) => r.toUserId);
			const profiles = profileIds.length > 0
				? await db.query.biodataProfile.findMany({
						where: (bp, { inArray }) => inArray(bp.userId, profileIds),
					})
				: [];
			const profileMap = new Map(profiles.map((p) => [p.userId, p]));
			return results.map((r) => ({ ...r, profile: profileMap.get(r.toUserId) }));
		}

		// Sort received interests by bid amount (highest first), then by date
		const results = await db.query.interest.findMany({
			where: eq(interest.toUserId, user.id),
			orderBy: [desc(interest.bidAmount), desc(interest.createdAt)],
		});
		const profileIds = results.map((r) => r.fromUserId);
		const profiles = profileIds.length > 0
			? await db.query.biodataProfile.findMany({
					where: (bp, { inArray }) => inArray(bp.userId, profileIds),
				})
			: [];
		const profileMap = new Map(profiles.map((p) => [p.userId, p]));
		return results.map((r) => ({ ...r, profile: profileMap.get(r.fromUserId) }));
	});
