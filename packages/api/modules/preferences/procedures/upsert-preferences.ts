import { db, partnerPreference } from "@repo/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const upsertPreferences = protectedProcedure
	.route({
		method: "POST",
		path: "/preferences",
		tags: ["Preferences"],
		summary: "Set or update partner preferences",
	})
	.input(
		z.object({
			marriageTimeline: z.string().optional(),
			willingToRelocate: z.boolean().optional(),
			requiresCitizenship: z.boolean().optional(),
			valuesLooks: z.number().int().min(1).max(10).optional(),
			valuesPersonality: z.number().int().min(1).max(10).optional(),
			valuesFinancial: z.number().int().min(1).max(10).optional(),
			quizComplete: z.boolean().optional(),
			ageMin: z.number().int().optional(),
			ageMax: z.number().int().optional(),
			heightMin: z.number().int().optional(),
			heightMax: z.number().int().optional(),
			religions: z.string().optional(),
			communities: z.string().optional(),
			educationLevels: z.string().optional(),
			professions: z.string().optional(),
			locations: z.string().optional(),
			diet: z.string().optional(),
			maritalStatus: z.string().optional(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const existing = await db.query.partnerPreference.findFirst({
			where: eq(partnerPreference.userId, user.id),
		});

		if (existing) {
			const [updated] = await db
				.update(partnerPreference)
				.set({ ...input, updatedAt: new Date() })
				.where(eq(partnerPreference.userId, user.id))
				.returning();
			return updated;
		}

		const [created] = await db
			.insert(partnerPreference)
			.values({ ...input, userId: user.id })
			.returning();
		return created;
	});
