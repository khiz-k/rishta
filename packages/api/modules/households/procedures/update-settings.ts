import { biodataProfile, db, householdSetting, PAGE_LANGUAGES } from "@repo/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { timeZoneSchema } from "../../profiles/lib/sections";
import { requireHousehold } from "../lib/context";
import { HouseholdSettingsSchema } from "../types";

export const updateHouseholdSettings = protectedProcedure
	.route({
		method: "PATCH",
		path: "/households/{organizationId}/settings",
		tags: ["Households"],
		summary: "Update household settings",
		description:
			"What the household can see and do, the folio hour and the family language. Owner only.",
	})
	.input(
		z.object({
			organizationId: z.string(),
			familyReadsFolio: z.boolean().optional(),
			familyEditsPage: z.boolean().optional(),
			familySeesIntroductions: z.boolean().optional(),
			familyLinksAllowed: z.boolean().optional(),
			familyLanguage: z.enum(PAGE_LANGUAGES).optional(),
			readIncognito: z.boolean().optional(),
			discreetEmails: z.boolean().optional(),
			keyboardShortcuts: z.boolean().optional(),
			folioReleaseHour: z.number().int().min(0).max(23).optional(),
			timeZone: timeZoneSchema.optional(),
		}),
	)
	.output(HouseholdSettingsSchema.extend({ timeZone: z.string().nullable() }))
	.handler(async ({ input, context: { user } }) => {
		const context = await requireHousehold(input.organizationId, user.id, ["owner"]);
		const { organizationId, timeZone, ...changes } = input;

		const [saved] = await db
			.insert(householdSetting)
			.values({ ...context.settings, ...changes, organizationId })
			.onConflictDoUpdate({
				target: householdSetting.organizationId,
				set: { ...changes, updatedAt: new Date() },
			})
			.returning();

		if (timeZone && context.page) {
			await db
				.update(biodataProfile)
				.set({ timeZone })
				.where(eq(biodataProfile.organizationId, organizationId));
		}

		const {
			createdAt: _createdAt,
			updatedAt: _updatedAt,
			organizationId: _id,
			...settings
		} = saved ?? { ...context.settings, createdAt: null, updatedAt: null };

		return { ...settings, timeZone: timeZone ?? context.page?.timeZone ?? null };
	});
