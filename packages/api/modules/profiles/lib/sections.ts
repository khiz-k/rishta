import {
	DIETS,
	DRINKING_HABITS,
	EDUCATION_LEVELS,
	FAMILY_TYPES,
	FAMILY_VALUES,
	GENDERS,
	INCOME_RANGES,
	INVOCATIONS,
	MANGLIK_VALUES,
	MARITAL_STATUSES,
	PAGE_AUTHORS,
	PAGE_LANGUAGES,
	PRACTICES,
	RELIGIONS,
	RESIDENCIES,
	SMOKING_HABITS,
} from "@repo/database";
import { z } from "zod";

import { isValidTimeZone } from "../../../lib/time";

/** Page field schemas, grouped by the section they are edited in (spec.md F4). */

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const timeZoneSchema = z.string().refine(isValidTimeZone, "Unknown time zone");

export const nameSectionSchema = z.object({
	invocation: z.enum(INVOCATIONS).optional(),
	invocationText: optionalText(60),
	displayName: z.string().trim().min(1).max(40).optional(),
	fullName: optionalText(80),
	pageLanguage: z.enum(PAGE_LANGUAGES).optional(),
	createdBy: z.enum(PAGE_AUTHORS).optional(),
});

export const personalSectionSchema = z.object({
	gender: z.enum(GENDERS).optional(),
	dateOfBirth: dateString.optional(),
	height: z.number().int().min(120).max(230).nullable().optional(),
	maritalStatus: z.enum(MARITAL_STATUSES).optional(),
	hasChildren: z.boolean().nullable().optional(),
	religion: z.enum(RELIGIONS).optional(),
	sect: optionalText(60),
	practice: z.enum(PRACTICES).nullable().optional(),
	community: optionalText(60),
	motherTongue: optionalText(40),
	languages: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
	location: optionalText(80),
	country: z
		.string()
		.trim()
		.regex(/^[A-Za-z]{2}$/, "Use a two-letter country code")
		.transform((value) => value.toUpperCase())
		.nullable()
		.optional(),
	timeZone: timeZoneSchema.optional(),
	residency: z.enum(RESIDENCIES).nullable().optional(),
	manglik: z.enum(MANGLIK_VALUES).nullable().optional(),
});

export const educationSectionSchema = z.object({
	education: z.enum(EDUCATION_LEVELS).nullable().optional(),
	university: optionalText(120),
	profession: optionalText(120),
	employer: optionalText(120),
	incomeRange: z.enum(INCOME_RANGES).nullable().optional(),
});

export const familySectionSchema = z.object({
	fatherOccupation: optionalText(120),
	motherOccupation: optionalText(120),
	siblings: optionalText(200),
	familyType: z.enum(FAMILY_TYPES).nullable().optional(),
	familyValues: z.enum(FAMILY_VALUES).nullable().optional(),
	nativePlace: optionalText(80),
	aboutFamily: optionalText(1200),
});

export const lifestyleSectionSchema = z.object({
	diet: z.enum(DIETS).optional(),
	smoking: z.enum(SMOKING_HABITS).optional(),
	drinking: z.enum(DRINKING_HABITS).optional(),
});

export const aboutSectionSchema = z.object({
	aboutMe: optionalText(1500),
});

export const lookingForSectionSchema = z.object({
	lookingFor: optionalText(1200),
});

export const sealedSectionSchema = z.object({
	contactPhone: z
		.string()
		.trim()
		.regex(/^\+[1-9]\d{6,14}$/, "Use the international format, e.g. +17325550199")
		.nullable()
		.optional(),
	birthTime: z
		.string()
		.regex(/^\d{2}:\d{2}$/, "Use HH:MM")
		.nullable()
		.optional(),
	birthPlace: optionalText(80),
	familyContactName: optionalText(60),
	familyContactPhone: z
		.string()
		.trim()
		.regex(/^\+[1-9]\d{6,14}$/, "Use the international format")
		.nullable()
		.optional(),
});

/** In-place edits: one section at a time (`profiles.patch`). */
export const PATCH_SECTION_IDS = [
	"name",
	"personal",
	"education",
	"family",
	"lifestyle",
	"about",
	"looking_for",
	"sealed",
] as const;

export const pageSectionPatchSchema = z.discriminatedUnion("section", [
	z.object({ section: z.literal("name"), values: nameSectionSchema }),
	z.object({ section: z.literal("personal"), values: personalSectionSchema }),
	z.object({ section: z.literal("education"), values: educationSectionSchema }),
	z.object({ section: z.literal("family"), values: familySectionSchema }),
	z.object({ section: z.literal("lifestyle"), values: lifestyleSectionSchema }),
	z.object({ section: z.literal("about"), values: aboutSectionSchema }),
	z.object({ section: z.literal("looking_for"), values: lookingForSectionSchema }),
	z.object({ section: z.literal("sealed"), values: sealedSectionSchema }),
]);

/** The guided first write (`profiles.upsert`): every section at once, with the required four. */
export const fullPageSchema = nameSectionSchema
	.extend(personalSectionSchema.shape)
	.extend(educationSectionSchema.shape)
	.extend(familySectionSchema.shape)
	.extend(lifestyleSectionSchema.shape)
	.extend(aboutSectionSchema.shape)
	.extend(lookingForSectionSchema.shape)
	.extend(sealedSectionSchema.shape)
	.extend({
		displayName: z.string().trim().min(1).max(40),
		gender: z.enum(GENDERS),
		dateOfBirth: dateString,
		religion: z.enum(RELIGIONS),
	});

/** Drops keys that were not sent, so a patch never clears untouched fields. */
export function definedValues<T extends Record<string, unknown>>(values: T) {
	const result: Partial<T> = {};
	for (const [key, value] of Object.entries(values) as Array<[keyof T, T[keyof T]]>) {
		if (value !== undefined) {
			result[key] = value;
		}
	}
	return result;
}
