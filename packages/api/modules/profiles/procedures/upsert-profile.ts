import { db, biodataProfile } from "@repo/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const upsertProfile = protectedProcedure
	.route({
		method: "POST",
		path: "/profiles",
		tags: ["Profiles"],
		summary: "Create or update biodata profile",
	})
	.input(
		z.object({
			displayName: z.string().min(1),
			gender: z.enum(["male", "female"]),
			dateOfBirth: z.string(),
			height: z.number().int().optional(),
			religion: z.string().min(1),
			community: z.string().optional(),
			motherTongue: z.string().optional(),
			maritalStatus: z.enum(["never_married", "divorced", "widowed", "annulled"]).default("never_married"),
			education: z.string().optional(),
			university: z.string().optional(),
			profession: z.string().optional(),
			employer: z.string().optional(),
			incomeRange: z.string().optional(),
			familyType: z.string().optional(),
			fatherOccupation: z.string().optional(),
			motherOccupation: z.string().optional(),
			siblings: z.string().optional(),
			diet: z.enum(["veg", "non_veg", "eggetarian", "vegan", "jain_veg"]).default("non_veg"),
			smoking: z.enum(["never", "occasionally", "regularly"]).default("never"),
			drinking: z.enum(["never", "occasionally", "socially", "regularly"]).default("never"),
			aboutMe: z.string().optional(),
			lookingFor: z.string().optional(),
			createdBy: z.enum(["self", "parent", "sibling", "relative"]).default("self"),
			location: z.string().optional(),
			profilePhoto: z.string().optional(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const existing = await db.query.biodataProfile.findFirst({
			where: eq(biodataProfile.userId, user.id),
		});

		if (existing) {
			const [updated] = await db
				.update(biodataProfile)
				.set({ ...input, updatedAt: new Date() })
				.where(eq(biodataProfile.userId, user.id))
				.returning();
			return updated;
		}

		const [created] = await db
			.insert(biodataProfile)
			.values({ ...input, userId: user.id })
			.returning();
		return created;
	});
