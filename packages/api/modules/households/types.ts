import { BIODATA_STATUSES, CANDIDATE_RELATIONS, PAGE_LANGUAGES } from "@repo/database";
import { z } from "zod";

export const HouseholdSettingsSchema = z.object({
	candidateRelation: z.enum(CANDIDATE_RELATIONS),
	pendingCandidateEmail: z.string().nullable(),
	familyReadsFolio: z.boolean(),
	familyEditsPage: z.boolean(),
	familySeesIntroductions: z.boolean(),
	familyLinksAllowed: z.boolean(),
	familyLanguage: z.enum(PAGE_LANGUAGES),
	readIncognito: z.boolean(),
	discreetEmails: z.boolean(),
	keyboardShortcuts: z.boolean(),
	folioReleaseHour: z.number().int().min(0).max(23),
	memberLabels: z.record(z.string(), z.string()),
});

export const HouseholdSchema = z.object({
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	role: z.enum(["owner", "admin", "member"]),
	isCandidate: z.boolean(),
	candidate: z.object({
		userId: z.string().nullable(),
		firstName: z.string(),
		/** The page's display name (public on every page header): the seal's two initials. */
		displayName: z.string(),
	}),
	page: z
		.object({
			handle: z.string(),
			status: z.enum(BIODATA_STATUSES),
			timeZone: z.string(),
			publishedAt: z.string().nullable(),
		})
		.nullable(),
	lookingForComplete: z.boolean(),
	settings: HouseholdSettingsSchema,
	plan: z.enum(["free", "premium"]),
	seatsUsed: z.number().int(),
	seatsLimit: z.number().int(),
	members: z.array(
		z.object({
			userId: z.string(),
			name: z.string(),
			role: z.enum(["owner", "admin", "member"]),
			label: z.string().nullable(),
			isCandidate: z.boolean(),
		}),
	),
});
