/**
 * Rishta domain vocabulary shared by the Drizzle schema, the API and the seed.
 * Enum values mirror spec.md §6.1. Keep this file free of runtime imports so it
 * can be used from any package (and from the schema itself).
 */

export const BIODATA_STATUSES = ["draft", "awaiting_claim", "active", "paused", "closed"] as const;
export const GENDERS = ["male", "female"] as const;
export const MARITAL_STATUSES = ["never_married", "divorced", "widowed", "annulled"] as const;
export const RELIGIONS = [
	"hindu",
	"muslim",
	"sikh",
	"christian",
	"jain",
	"buddhist",
	"jewish",
	"parsi",
	"other",
	"none",
] as const;
export const PRACTICES = ["very", "moderately", "somewhat", "not_practising"] as const;
export const EDUCATION_LEVELS = [
	"high_school",
	"diploma",
	"bachelors",
	"masters",
	"phd",
	"professional",
	"other",
] as const;
export const INCOME_RANGES = [
	"under_50k",
	"50k_75k",
	"75k_100k",
	"100k_150k",
	"150k_plus",
	"prefer_not_to_say",
] as const;
export const FAMILY_TYPES = ["joint", "nuclear"] as const;
export const FAMILY_VALUES = ["traditional", "moderate", "liberal"] as const;
export const DIETS = ["veg", "eggetarian", "vegan", "jain_veg", "non_veg", "halal"] as const;
export const SMOKING_HABITS = ["never", "occasionally", "regularly"] as const;
export const DRINKING_HABITS = ["never", "occasionally", "socially", "regularly"] as const;
export const PAGE_AUTHORS = ["self", "parent", "sibling", "relative", "friend"] as const;
export const CANDIDATE_RELATIONS = [
	"self",
	"son",
	"daughter",
	"brother",
	"sister",
	"relative",
] as const;
export const RESIDENCIES = [
	"citizen",
	"permanent_resident",
	"work_visa",
	"student_visa",
	"other",
] as const;
export const MANGLIK_VALUES = ["yes", "no", "partial", "dont_know"] as const;
export const INVOCATIONS = [
	"none",
	"om",
	"shri_ganesh",
	"bismillah",
	"ik_onkar",
	"cross",
	"khanda",
	"custom",
] as const;
export const PAGE_LANGUAGES = ["en", "hi", "ur", "pa", "gu", "bn", "ta", "te"] as const;
export const FIELD_VISIBILITIES = ["page", "sealed", "matching_only"] as const;
export const PHOTO_VISIBILITIES = ["everyone", "after_note", "after_yes"] as const;
export const VERIFICATION_LEVELS = ["none", "email", "phone", "id"] as const;
export const TIMELINES = ["3_months", "6_months", "1_year", "2_years_plus"] as const;
export const RELOCATIONS = ["open", "within_country", "not_open"] as const;
export const RESIDENCY_REQUIREMENTS = ["citizen_or_pr", "open"] as const;
export const FIT_KEYS = [
	"timeline",
	"religion",
	"diet",
	"age",
	"marital_status",
	"location",
	"residency",
	"education",
	"community",
	"language",
	"height",
] as const;
export const FOLIO_PAGE_STATES = ["unread", "read", "kept", "passed", "noted"] as const;
export const PASS_REASONS = [
	"timeline",
	"distance",
	"family",
	"faith",
	"lifestyle",
	"feeling",
	"other",
] as const;
export const LETTER_STATUSES = ["pending", "accepted", "declined", "withdrawn", "closed"] as const;
export const DECLINE_MODES = ["kind_note", "quiet"] as const;
export const INTRODUCTION_STAGES = ["introduced", "call_booked", "families", "closed"] as const;
export const CLOSE_REASONS = [
	"not_a_fit",
	"engaged_elsewhere",
	"search_closed",
	"engaged_to_each_other",
	"other",
] as const;
export const CALL_PROPOSAL_STATUSES = ["open", "booked", "superseded", "declined"] as const;
export const FAMILY_REACTIONS = ["proceed", "lets_talk", "not_for_us"] as const;
export const REPORT_CATEGORIES = [
	"scam_money",
	"harassment",
	"fake_profile",
	"underage",
	"pressure_to_marry",
	"hate",
	"other",
] as const;
export const REPORT_CONTEXTS = ["page", "letter", "message", "family_link"] as const;
export const REPORT_STATUSES = ["open", "reviewing", "actioned", "dismissed"] as const;
export const LEDGER_REASONS = [
	"welcome",
	"purchase",
	"monthly_grant",
	"extra_note",
	"priority_note",
	"refund",
	"adjustment",
] as const;
export const CLOSED_REASONS = ["engaged", "break", "other"] as const;
export const SAFETY_CATEGORIES = ["money", "off_platform", "visa", "harassment"] as const;
export const SUGGESTION_SOURCES = ["ai", "template"] as const;

export type BiodataStatus = (typeof BIODATA_STATUSES)[number];
export type Gender = (typeof GENDERS)[number];
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];
export type Religion = (typeof RELIGIONS)[number];
export type Practice = (typeof PRACTICES)[number];
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];
export type IncomeRange = (typeof INCOME_RANGES)[number];
export type FamilyType = (typeof FAMILY_TYPES)[number];
export type FamilyValues = (typeof FAMILY_VALUES)[number];
export type Diet = (typeof DIETS)[number];
export type Smoking = (typeof SMOKING_HABITS)[number];
export type Drinking = (typeof DRINKING_HABITS)[number];
export type PageAuthor = (typeof PAGE_AUTHORS)[number];
export type CandidateRelation = (typeof CANDIDATE_RELATIONS)[number];
export type Residency = (typeof RESIDENCIES)[number];
export type Manglik = (typeof MANGLIK_VALUES)[number];
export type Invocation = (typeof INVOCATIONS)[number];
export type PageLanguage = (typeof PAGE_LANGUAGES)[number];
export type FieldVisibility = (typeof FIELD_VISIBILITIES)[number];
export type PhotoVisibility = (typeof PHOTO_VISIBILITIES)[number];
export type VerificationLevel = (typeof VERIFICATION_LEVELS)[number];
export type Timeline = (typeof TIMELINES)[number];
export type Relocation = (typeof RELOCATIONS)[number];
export type ResidencyRequirement = (typeof RESIDENCY_REQUIREMENTS)[number];
export type FitKey = (typeof FIT_KEYS)[number];
export type FolioPageState = (typeof FOLIO_PAGE_STATES)[number];
export type PassReason = (typeof PASS_REASONS)[number];
export type LetterStatus = (typeof LETTER_STATUSES)[number];
export type DeclineMode = (typeof DECLINE_MODES)[number];
export type IntroductionStage = (typeof INTRODUCTION_STAGES)[number];
export type CloseReason = (typeof CLOSE_REASONS)[number];
export type CallProposalStatus = (typeof CALL_PROPOSAL_STATUSES)[number];
export type FamilyReaction = (typeof FAMILY_REACTIONS)[number];
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];
export type ReportContext = (typeof REPORT_CONTEXTS)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type LedgerReason = (typeof LEDGER_REASONS)[number];
export type ClosedReason = (typeof CLOSED_REASONS)[number];
export type SafetyCategory = (typeof SAFETY_CATEGORIES)[number];
export type SuggestionSource = (typeof SUGGESTION_SOURCES)[number];

/** Page fields whose visibility the candidate controls (spec.md F4). */
export const VISIBLE_FIELDS = [
	"fullName",
	"dateOfBirth",
	"height",
	"religion",
	"sect",
	"practice",
	"community",
	"motherTongue",
	"languages",
	"maritalStatus",
	"hasChildren",
	"education",
	"university",
	"profession",
	"employer",
	"incomeRange",
	"familyType",
	"familyValues",
	"fatherOccupation",
	"motherOccupation",
	"siblings",
	"nativePlace",
	"aboutFamily",
	"diet",
	"smoking",
	"drinking",
	"location",
	"country",
	"residency",
	"birthTime",
	"birthPlace",
	"manglik",
	"contactPhone",
] as const;
export type VisibleField = (typeof VISIBLE_FIELDS)[number];
export type FieldVisibilityMap = Partial<Record<VisibleField, FieldVisibility>>;

/** Special-category fields that may be used for matching only (explicit consent copy in the UI). */
export const MATCHING_ONLY_FIELDS: readonly VisibleField[] = [
	"religion",
	"sect",
	"community",
	"residency",
];

/** Defaults from spec.md F4: sensitive facts are sealed; residency is matching only. */
export const DEFAULT_FIELD_VISIBILITY: Readonly<Record<VisibleField, FieldVisibility>> = {
	fullName: "sealed",
	dateOfBirth: "sealed",
	height: "page",
	religion: "page",
	sect: "page",
	practice: "page",
	community: "page",
	motherTongue: "page",
	languages: "page",
	maritalStatus: "page",
	hasChildren: "page",
	education: "page",
	university: "page",
	profession: "page",
	employer: "sealed",
	incomeRange: "sealed",
	familyType: "page",
	familyValues: "page",
	fatherOccupation: "page",
	motherOccupation: "page",
	siblings: "page",
	nativePlace: "page",
	aboutFamily: "page",
	diet: "page",
	smoking: "page",
	drinking: "page",
	location: "page",
	country: "page",
	residency: "matching_only",
	birthTime: "sealed",
	birthPlace: "sealed",
	manglik: "page",
	contactPhone: "sealed",
};

export function resolveFieldVisibility(
	map: FieldVisibilityMap | null | undefined,
	field: VisibleField,
): FieldVisibility {
	return map?.[field] ?? DEFAULT_FIELD_VISIBILITY[field];
}

export type FitVerdict = "fits" | "gap" | "unknown";

/** One plain reason shown in "Why this page" (never a score). */
export interface FitReason {
	key: FitKey;
	verdict: FitVerdict;
	params: Record<string, string>;
}

export type SafetySource = "rules" | "ai";

/** A safety flag shown to the recipient only (spec.md F17d). */
export interface SafetyFlag {
	category: SafetyCategory;
	categories: SafetyCategory[];
	reason: string;
	source: SafetySource;
}

/** Cached translation of a stranger-redacted page for a family link (spec.md §9c). */
export interface TranslatedPage {
	fields: Array<{ key: string; value: string }>;
	about?: string;
	aboutFamily?: string;
	lookingFor?: string;
}

/** Household entitlements (spec.md §11). The candidate is not counted in `familySeats`. */
export const PLAN_LIMITS = {
	free: {
		folioSize: 5,
		notesPerDay: 3,
		familySeats: 2,
		activeFamilyLinks: 3,
		monthlyCredits: 0,
	},
	premium: {
		folioSize: 7,
		notesPerDay: 10,
		familySeats: 6,
		activeFamilyLinks: Number.POSITIVE_INFINITY,
		monthlyCredits: 2,
	},
} as const;
export type HouseholdPlan = keyof typeof PLAN_LIMITS;

export const WELCOME_CREDITS = 10;
export const CREDITS_PER_PACK = 5;

/** Crockford base32 without I, L, O, U. */
const CROCKFORD_ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";
export const HANDLE_LENGTH = 6;

/** A random 6-character page handle, stored lowercase ("7kq2m9"). */
export function generateHandle(random: (max: number) => number = defaultRandomInt): string {
	let handle = "";
	for (let i = 0; i < HANDLE_LENGTH; i++) {
		handle += CROCKFORD_ALPHABET.charAt(random(CROCKFORD_ALPHABET.length));
	}
	return handle;
}

/** Normalises user input ("No. 7KQ-2M9", "7kq2m9", "7KQ-2MO") to the stored handle form. */
export function normalizeHandle(input: string): string {
	return input
		.trim()
		.toLowerCase()
		.replace(/^no\.?\s*/, "")
		.replace(/[-\s]/g, "")
		.replace(/[il]/g, "1")
		.replace(/o/g, "0");
}

/** The printed reference for a handle: "7KQ-2M9". */
export function formatHandleRef(handle: string): string {
	const upper = handle.toUpperCase();
	return `${upper.slice(0, 3)}-${upper.slice(3)}`;
}

function defaultRandomInt(max: number): number {
	return Math.floor(Math.random() * max);
}
