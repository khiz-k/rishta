import { db, biodataProfile } from "@repo/database";
import { eq } from "drizzle-orm";

import { protectedProcedure } from "../../../orpc/procedures";

export const getMyProfile = protectedProcedure
	.route({
		method: "GET",
		path: "/profiles/me",
		tags: ["Profiles"],
		summary: "Get the current user's biodata profile",
	})
	.handler(async ({ context: { user } }) => {
		return await db.query.biodataProfile.findFirst({
			where: eq(biodataProfile.userId, user.id),
		});
	});
