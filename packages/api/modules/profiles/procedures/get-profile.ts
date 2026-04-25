import { db, biodataProfile } from "@repo/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const getProfile = protectedProcedure
	.route({
		method: "GET",
		path: "/profiles/{userId}",
		tags: ["Profiles"],
		summary: "View a specific profile",
	})
	.input(z.object({ userId: z.string() }))
	.handler(async ({ input }) => {
		return await db.query.biodataProfile.findFirst({
			where: eq(biodataProfile.userId, input.userId),
		});
	});
