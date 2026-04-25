import { db, shortlist } from "@repo/database";
import { eq, desc } from "drizzle-orm";

import { protectedProcedure } from "../../../orpc/procedures";

export const listShortlists = protectedProcedure
	.route({
		method: "GET",
		path: "/shortlists",
		tags: ["Shortlists"],
		summary: "List shortlisted profiles",
	})
	.handler(async ({ context: { user } }) => {
		const items = await db.query.shortlist.findMany({
			where: eq(shortlist.userId, user.id),
			orderBy: [desc(shortlist.createdAt)],
		});

		if (items.length === 0) return [];

		const profileIds = items.map((i) => i.profileUserId);
		const profiles = await db.query.biodataProfile.findMany({
			where: (bp, { inArray }) => inArray(bp.userId, profileIds),
		});

		const profileMap = new Map(profiles.map((p) => [p.userId, p]));
		return items.map((i) => ({ ...i, profile: profileMap.get(i.profileUserId) }));
	});
