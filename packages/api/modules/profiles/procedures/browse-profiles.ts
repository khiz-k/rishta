import { db, biodataProfile } from "@repo/database";
import { eq, and, ne, desc } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const browseProfiles = protectedProcedure
	.route({
		method: "GET",
		path: "/profiles/browse",
		tags: ["Profiles"],
		summary: "Browse profiles for matching",
	})
	.input(
		z.object({
			gender: z.enum(["male", "female"]).optional(),
			religion: z.string().optional(),
			community: z.string().optional(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const conditions = [
			ne(biodataProfile.userId, user.id),
			eq(biodataProfile.isActive, true),
		];

		if (input.gender) {
			conditions.push(eq(biodataProfile.gender, input.gender));
		}
		if (input.religion) {
			conditions.push(eq(biodataProfile.religion, input.religion));
		}
		if (input.community) {
			conditions.push(eq(biodataProfile.community, input.community));
		}

		return await db.query.biodataProfile.findMany({
			where: and(...conditions),
			orderBy: [desc(biodataProfile.createdAt)],
		});
	});
