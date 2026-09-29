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
	MATCHING_ONLY_FIELDS,
	PAGE_AUTHORS,
	PAGE_LANGUAGES,
	PRACTICES,
	RELIGIONS,
	RESIDENCIES,
	SMOKING_HABITS,
	VISIBLE_FIELDS,
	type VisibleField,
} from "@repo/database/drizzle/domain";
import type { OwnerPage } from "@shared/lib/api-types";

/** The sections `profiles.patch` accepts (packages/api/modules/profiles/lib/sections.ts). */
export type PatchSection =
	| "name"
	| "personal"
	| "education"
	| "family"
	| "lifestyle"
	| "about"
	| "looking_for"
	| "sealed";

export type FieldKind =
	| "text"
	| "longtext"
	| "height"
	| "date"
	| "time"
	| "choice"
	| "boolean"
	| "list"
	| "phone"
	| "country"
	| "timezone";

/** Keys of the owner page an editor field writes. */
export type EditorKey = Extract<keyof OwnerPage, string>;

export interface FieldDef {
	key: EditorKey;
	section: PatchSection;
	kind: FieldKind;
	/** Enum values for a choice. */
	options?: readonly string[];
	/** How the options are labelled: page.values.<field>, or a biodata.* list. */
	optionLabels?: "values" | "authors" | "invocations" | "languages";
	maxLength?: number;
	/** Required to publish (display name, gender, date of birth, faith). */
	required?: boolean;
	/** Can be cleared back to empty. */
	nullable?: boolean;
}

const text = (key: EditorKey, section: PatchSection, maxLength: number): FieldDef => ({
	key,
	section,
	kind: "text",
	maxLength,
	nullable: true,
});

const choice = (
	key: EditorKey,
	section: PatchSection,
	options: readonly string[],
	nullable = true,
): FieldDef => ({ key, section, kind: "choice", options, optionLabels: "values", nullable });

/** The page's sections in the traditional order (spec.md F4), as the editor lays them out. */
export const EDITOR_SECTIONS: Array<{
	id: "personal" | "education" | "family" | "lifestyle";
	fields: FieldDef[];
}> = [
	{
		id: "personal",
		fields: [
			{ ...choice("gender", "personal", GENDERS, false), required: true },
			{ key: "dateOfBirth", section: "personal", kind: "date", required: true },
			{ key: "height", section: "personal", kind: "height", nullable: true },
			choice("maritalStatus", "personal", MARITAL_STATUSES, false),
			{ key: "hasChildren", section: "personal", kind: "boolean", nullable: true },
			text("motherTongue", "personal", 40),
			{ key: "languages", section: "personal", kind: "list", maxLength: 40 },
			{ ...choice("religion", "personal", RELIGIONS, false), required: true },
			text("sect", "personal", 60),
			choice("practice", "personal", PRACTICES),
			text("community", "personal", 60),
			text("location", "personal", 80),
			{ key: "country", section: "personal", kind: "country", nullable: true },
			{ key: "timeZone", section: "personal", kind: "timezone" },
			choice("residency", "personal", RESIDENCIES),
			choice("manglik", "personal", MANGLIK_VALUES),
		],
	},
	{
		id: "education",
		fields: [
			choice("education", "education", EDUCATION_LEVELS),
			text("university", "education", 120),
			text("profession", "education", 120),
			text("employer", "education", 120),
			choice("incomeRange", "education", INCOME_RANGES),
		],
	},
	{
		id: "family",
		fields: [
			text("fatherOccupation", "family", 120),
			text("motherOccupation", "family", 120),
			text("siblings", "family", 200),
			choice("familyType", "family", FAMILY_TYPES),
			choice("familyValues", "family", FAMILY_VALUES),
			text("nativePlace", "family", 80),
			{
				key: "aboutFamily",
				section: "family",
				kind: "longtext",
				maxLength: 1200,
				nullable: true,
			},
		],
	},
	{
		id: "lifestyle",
		fields: [
			choice("diet", "lifestyle", DIETS, false),
			choice("smoking", "lifestyle", SMOKING_HABITS, false),
			choice("drinking", "lifestyle", DRINKING_HABITS, false),
		],
	},
];

export const HEADER_FIELDS: FieldDef[] = [
	{ key: "displayName", section: "name", kind: "text", maxLength: 40, required: true },
	{
		key: "createdBy",
		section: "name",
		kind: "choice",
		options: PAGE_AUTHORS,
		optionLabels: "authors",
	},
	{
		key: "invocation",
		section: "name",
		kind: "choice",
		options: INVOCATIONS,
		optionLabels: "invocations",
	},
	{ key: "invocationText", section: "name", kind: "text", maxLength: 60, nullable: true },
	{
		key: "pageLanguage",
		section: "name",
		kind: "choice",
		options: PAGE_LANGUAGES,
		optionLabels: "languages",
	},
];

export const ABOUT_FIELD: FieldDef = {
	key: "aboutMe",
	section: "about",
	kind: "longtext",
	maxLength: 1500,
	nullable: true,
};

export const LOOKING_FOR_FIELD: FieldDef = {
	key: "lookingFor",
	section: "looking_for",
	kind: "longtext",
	maxLength: 1200,
	nullable: true,
};

export const SEALED_FIELDS: FieldDef[] = [
	{ key: "fullName", section: "name", kind: "text", maxLength: 80, nullable: true },
	{ key: "contactPhone", section: "sealed", kind: "phone", nullable: true },
	{ key: "birthTime", section: "sealed", kind: "time", nullable: true },
	text("birthPlace", "sealed", 80),
	text("familyContactName", "sealed", 60),
	{ key: "familyContactPhone", section: "sealed", kind: "phone", nullable: true },
];

export function isVisibleField(key: string): key is VisibleField {
	return (VISIBLE_FIELDS as readonly string[]).includes(key);
}

export function allowsMatchingOnly(key: VisibleField) {
	return MATCHING_ONLY_FIELDS.includes(key);
}
