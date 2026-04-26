import { db, profileView, biodataProfile } from "@repo/database";
import { eq, desc } from "drizzle-orm";

import { protectedProcedure } from "../../../orpc/procedures";

export const whoViewedMe = protectedProcedure
	.route({ method: "GET", path: "/profiles/viewers", tags: ["Profiles"], summary: "Get who viewed my profile" })
	.handler(async ({ context: { user } }) => {
		const views = await db.query.profileView.findMany({
			where: eq(profileView.profileUserId, user.id),
			orderBy: [desc(profileView.createdAt)],
		});

		// Get profiles for each viewer
		const viewerIds = views.map((v) => v.viewerUserId);
		if (viewerIds.length === 0) return [];

		const profiles = await db.query.biodataProfile.findMany({
			where: (bp, { inArray }) => inArray(bp.userId, viewerIds),
		});

		return views.map((v) => ({
			...v,
			profile: profiles.find((p) => p.userId === v.viewerUserId),
		}));
	});
