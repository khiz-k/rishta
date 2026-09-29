import {
	DIETS,
	db,
	EDUCATION_LEVELS,
	FIT_KEYS,
	GENDERS,
	MARITAL_STATUSES,
	partnerPreference,
	PartnerPreferenceSchema,
	RELIGIONS,
	RELOCATIONS,
	RESIDENCY_REQUIREMENTS,
	TIMELINES,
} from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { getHouseholdContext, isPageClaimed } from "../../households/lib/context";

/** The 12-point values budget: each 1-10, together never more than 12 (kept exactly). */
export const VALUES_BUDGET = 12;

const valuesSchema = z
	.object({
		looks: z.number().int().min(1).max(10),
		personality: z.number().int().min(1).max(10),
		financial: z.number().int().min(1).max(10),
	})
	.refine((values) => values.looks + values.personality + values.financial <= VALUES_BUDGET, {
		message: "The values budget is 12 points",
	});

const textList = (max: number) => z.array(z.string().trim().min(1).max(60)).max(max).default([]);

export const upsertPreferences = protectedProcedure
	.route({
		method: "POST",
		path: "/preferences",
		tags: ["Preferences"],
		summary: "Set what the household is looking for",
		description: "The five timeline-first steps. Changes affect tomorrow's folio, not today's.",
	})
	.input(
		z
			.object({
				organizationId: z.string(),
				seeking: z.enum(GENDERS),
				marriageTimeline: z.enum(TIMELINES).nullable().optional(),
				relocation: z.enum(RELOCATIONS).nullable().optional(),
				residencyRequirement: z.enum(RESIDENCY_REQUIREMENTS).nullable().optional(),
				values: valuesSchema.optional(),
				ageMin: z.number().int().min(18).max(80).nullable().optional(),
				ageMax: z.number().int().min(18).max(80).nullable().optional(),
				heightMin: z.number().int().min(120).max(230).nullable().optional(),
				heightMax: z.number().int().min(120).max(230).nullable().optional(),
				religions: z.array(z.enum(RELIGIONS)).default([]),
				communities: textList(12),
				educationLevels: z.array(z.enum(EDUCATION_LEVELS)).default([]),
				professions: textList(12),
				locations: textList(12),
				countries: z
					.array(
						z
							.string()
							.regex(/^[A-Za-z]{2}$/)
							.transform((value) => value.toUpperCase()),
					)
					.max(12)
					.default([]),
				diet: z.array(z.enum(DIETS)).default([]),
				maritalStatus: z.array(z.enum(MARITAL_STATUSES)).default([]),
				languages: textList(8),
				dealbreakers: z.array(z.enum(FIT_KEYS)).default(["timeline"]),
				complete: z.boolean().optional(),
			})
			.refine(
				(value) =>
					value.ageMin === null ||
					value.ageMin === undefined ||
					value.ageMax === null ||
					value.ageMax === undefined ||
					value.ageMin <= value.ageMax,
				{ message: "The youngest age must not be above the oldest", path: ["ageMin"] },
			)
			.refine(
				(value) =>
					!value.heightMin || !value.heightMax || value.heightMin <= value.heightMax,
				{
					message: "The shortest height must not be above the tallest",
					path: ["heightMin"],
				},
			),
	)
	.output(PartnerPreferenceSchema)
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		// The candidate edits; a guardian drafts it only before the page is claimed.
		const allowed =
			context.role === "owner" || (context.role === "admin" && !isPageClaimed(context.page));
		if (!allowed) {
			fail("FORBIDDEN", "ROLE_NOT_ALLOWED");
		}
		if (input.complete && (!input.marriageTimeline || !input.values)) {
			// Cannot finish without a timeline and the values budget (as today).
			fail("PRECONDITION_FAILED", "LOOKING_FOR_INCOMPLETE");
		}

		const { organizationId, values, complete, ...fields } = input;
		const completedAt = complete ? new Date() : undefined;
		const row = {
			...fields,
			marriageTimeline: fields.marriageTimeline ?? null,
			relocation: fields.relocation ?? null,
			residencyRequirement: fields.residencyRequirement ?? null,
			ageMin: fields.ageMin ?? null,
			ageMax: fields.ageMax ?? null,
			heightMin: fields.heightMin ?? null,
			heightMax: fields.heightMax ?? null,
			dealbreakers: Array.from(new Set(fields.dealbreakers)),
			...(values
				? {
						valuesLooks: values.looks,
						valuesPersonality: values.personality,
						valuesFinancial: values.financial,
					}
				: {}),
			// Legacy mirrors, kept in sync until the migration drops them.
			willingToRelocate: fields.relocation ? fields.relocation === "open" : null,
			requiresCitizenship: fields.residencyRequirement
				? fields.residencyRequirement === "citizen_or_pr"
				: null,
			userId: context.page?.userId ?? null,
			...(completedAt ? { completedAt, quizComplete: true } : {}),
		};

		const [saved] = await db
			.insert(partnerPreference)
			.values({ ...row, organizationId })
			.onConflictDoUpdate({
				target: partnerPreference.organizationId,
				set: { ...row, updatedAt: new Date() },
			})
			.returning();

		if (!saved) {
			fail("INTERNAL_SERVER_ERROR", "LOOKING_FOR_INCOMPLETE");
		}
		const { willingToRelocate: _a, requiresCitizenship: _b, quizComplete: _c, ...rest } = saved;
		return rest;
	});
