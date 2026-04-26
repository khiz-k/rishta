import { db, profileView } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const trackView = protectedProcedure
	.route({ method: "POST", path: "/profiles/view", tags: ["Profiles"], summary: "Track profile view" })
	.input(z.object({ profileUserId: z.string() }))
	.handler(async ({ context: { user }, input }) => {
		if (user.id === input.profileUserId) return { tracked: false };
		await db.insert(profileView).values({
			viewerUserId: user.id,
			profileUserId: input.profileUserId,
		}).onConflictDoNothing();
		return { tracked: true };
	});
