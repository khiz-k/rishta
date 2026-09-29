import {
	DIETS,
	EDUCATION_LEVELS,
	FIT_KEYS,
	GENDERS,
	MARITAL_STATUSES,
	RELIGIONS,
	RELOCATIONS,
	RESIDENCY_REQUIREMENTS,
	TIMELINES,
} from "@repo/database/drizzle/domain";
import type { Preference, PreferenceInput } from "@shared/lib/api-types";
import { z } from "zod";

const text = z.string().trim().min(1).max(60);

/** The whole Looking-for page as one react-hook-form value (the quiz and the page share it). */
export const lookingForSchema = z
	.object({
		seeking: z.enum(GENDERS),
		marriageTimeline: z.enum(TIMELINES).nullable(),
		relocation: z.enum(RELOCATIONS).nullable(),
		residencyRequirement: z.enum(RESIDENCY_REQUIREMENTS).nullable(),
		locations: z.array(text).max(12),
		ageMin: z.number().int().min(18).max(80),
		ageMax: z.number().int().min(18).max(80),
		religions: z.array(z.enum(RELIGIONS)),
		communities: z.array(text).max(12),
		educationLevels: z.array(z.enum(EDUCATION_LEVELS)),
		diet: z.array(z.enum(DIETS)),
		maritalStatus: z.array(z.enum(MARITAL_STATUSES)),
		languages: z.array(text).max(8),
		countries: z.array(z.string().regex(/^[A-Z]{2}$/)).max(12),
		professions: z.array(text).max(12),
		heightMin: z.number().int().min(120).max(230).nullable(),
		heightMax: z.number().int().min(120).max(230).nullable(),
		dealbreakers: z.array(z.enum(FIT_KEYS)),
		values: z
			.object({
				looks: z.number().int().min(1).max(10),
				personality: z.number().int().min(1).max(10),
				financial: z.number().int().min(1).max(10),
			})
			.refine((value) => value.looks + value.personality + value.financial <= 12),
	})
	.refine((value) => value.ageMin <= value.ageMax, { path: ["ageMin"] });

export type LookingForValues = z.infer<typeof lookingForSchema>;

export function toLookingForValues(
	preference: Preference | null,
	fallbackSeeking: LookingForValues["seeking"],
): LookingForValues {
	return {
		seeking: preference?.seeking ?? fallbackSeeking,
		marriageTimeline: preference?.marriageTimeline ?? null,
		relocation: preference?.relocation ?? null,
		residencyRequirement: preference?.residencyRequirement ?? null,
		locations: preference?.locations ?? [],
		ageMin: preference?.ageMin ?? 24,
		ageMax: preference?.ageMax ?? 38,
		religions: preference?.religions ?? [],
		communities: preference?.communities ?? [],
		educationLevels: preference?.educationLevels ?? [],
		diet: preference?.diet ?? [],
		maritalStatus: preference?.maritalStatus ?? [],
		languages: preference?.languages ?? [],
		countries: preference?.countries ?? [],
		professions: preference?.professions ?? [],
		heightMin: preference?.heightMin ?? null,
		heightMax: preference?.heightMax ?? null,
		dealbreakers: preference?.dealbreakers ?? ["timeline"],
		values: {
			looks: preference?.valuesLooks ?? 1,
			personality: preference?.valuesPersonality ?? 1,
			financial: preference?.valuesFinancial ?? 1,
		},
	};
}

export function toUpsertInput(
	organizationId: string,
	values: LookingForValues,
	complete: boolean,
): PreferenceInput {
	return {
		organizationId,
		seeking: values.seeking,
		marriageTimeline: values.marriageTimeline,
		relocation: values.relocation,
		residencyRequirement: values.residencyRequirement,
		values: values.values,
		ageMin: values.ageMin,
		ageMax: values.ageMax,
		religions: values.religions,
		communities: values.communities,
		educationLevels: values.educationLevels,
		locations: values.locations,
		countries: values.countries,
		professions: values.professions,
		heightMin: values.heightMin,
		heightMax: values.heightMax,
		diet: values.diet,
		maritalStatus: values.maritalStatus,
		languages: values.languages,
		dealbreakers: values.dealbreakers,
		complete: complete || undefined,
	};
}

/** The rows that can be a dealbreaker (spec.md §7, fit keys). */
export const DEALBREAKER_ROWS = [
	"timeline",
	"age",
	"marital_status",
	"religion",
	"diet",
	"location",
	"residency",
	"education",
	"community",
] as const;
