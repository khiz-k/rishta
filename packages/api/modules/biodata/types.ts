import {
	BIODATA_STATUSES,
	CALL_PROPOSAL_STATUSES,
	DECLINE_MODES,
	FAMILY_REACTIONS,
	FIT_KEYS,
	INTRODUCTION_STAGES,
	INVOCATIONS,
	PAGE_AUTHORS,
	PAGE_LANGUAGES,
	PHOTO_VISIBILITIES,
	SAFETY_CATEGORIES,
	VERIFICATION_LEVELS,
} from "@repo/database";
import { z } from "zod";

/**
 * Shared output contracts (spec.md §8). Cross-household pages only ever leave the API as a
 * `PageView`, built by the redaction layer in `lib/page-view.ts`, never as raw rows.
 */

export const PAGE_RELATIONSHIPS = [
	"self",
	"household",
	"stranger",
	"i_wrote",
	"wrote_to_me",
	"introduced",
	"family_link",
] as const;
export type PageRelationship = (typeof PAGE_RELATIONSHIPS)[number];

export const SECTION_IDS = [
	"personal",
	"education",
	"family",
	"lifestyle",
	"about",
	"looking_for",
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const FitReasonSchema = z.object({
	key: z.enum(FIT_KEYS),
	verdict: z.enum(["fits", "gap", "unknown"]),
	params: z.record(z.string(), z.string()),
});

export const SafetyFlagSchema = z.object({
	category: z.enum(SAFETY_CATEGORIES),
	categories: z.array(z.enum(SAFETY_CATEGORIES)),
	reason: z.string(),
	source: z.enum(["rules", "ai"]),
});

export const PageFieldSchema = z.object({
	key: z.string(),
	value: z.union([z.string(), z.array(z.string())]),
});

export const PagePhotoSchema = z.object({
	id: z.string(),
	url: z.string(),
	veiled: z.boolean(),
	width: z.number().int(),
	height: z.number().int(),
});

export const PageViewSchema = z.object({
	handle: z.string(),
	ref: z.string(),
	relationship: z.enum(PAGE_RELATIONSHIPS),
	status: z.enum(BIODATA_STATUSES),
	language: z.enum(PAGE_LANGUAGES),
	dir: z.enum(["ltr", "rtl"]),
	invocation: z.object({ kind: z.enum(INVOCATIONS), text: z.string().optional() }).nullable(),
	header: z.object({
		displayName: z.string(),
		age: z.number().int().nullable(),
		birthMonthYear: z.string().nullable(),
		heightCm: z.number().int().optional(),
		city: z.string().optional(),
		country: z.string().optional(),
		signer: z.object({
			createdBy: z.enum(PAGE_AUTHORS),
			confirmedByCandidate: z.boolean(),
			candidateFirstName: z.string(),
		}),
		verification: z.enum(VERIFICATION_LEVELS),
	}),
	sections: z.array(
		z.object({
			id: z.enum(SECTION_IDS),
			fields: z.array(PageFieldSchema),
			text: z.string().optional(),
		}),
	),
	photos: z.array(PagePhotoSchema),
	sealed: z.discriminatedUnion("open", [
		z.object({ open: z.literal(false) }),
		z.object({
			open: z.literal(true),
			fields: z.array(z.object({ key: z.string(), value: z.string() })),
		}),
	]),
	updatedAt: z.string(),
});
export type PageView = z.infer<typeof PageViewSchema>;

export const MarginNoteSchema = z.object({
	id: z.string(),
	authorLabel: z.string(),
	via: z.enum(["app", "link"]),
	reaction: z.enum(FAMILY_REACTIONS).nullable(),
	text: z.string().nullable(),
	isMine: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
});
export type MarginNote = z.infer<typeof MarginNoteSchema>;

/** A letter's state in words the UI translates (design.md §5.4-5.6). */
export const LETTER_STATES = [
	"waiting_for_you",
	"waiting_for_them",
	"introduced",
	"call_booked",
	"families",
	"introduction_closed",
	"declined_by_you",
	"declined_by_them",
	"withdrawn_by_you",
	"withdrawn_by_them",
	"expired",
	"closed",
] as const;
export type LetterState = (typeof LETTER_STATES)[number];

export const LetterSummarySchema = z.object({
	letterId: z.string(),
	direction: z.enum(["sent", "received"]),
	otherHandle: z.string(),
	otherName: z.string(),
	otherAge: z.number().int().nullable(),
	otherCity: z.string().nullable(),
	state: z.enum(LETTER_STATES),
	// Null for family members, who only ever see stage lines.
	firstLine: z.string().nullable(),
	isPriority: z.boolean(),
	safetyFlag: SafetyFlagSchema.optional(),
	declineMode: z.enum(DECLINE_MODES).nullable(),
	hasFamilyReaction: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
	introduction: z
		.object({
			matchId: z.string(),
			stage: z.enum(INTRODUCTION_STAGES),
			bookedSlot: z.string().nullable(),
			yourMove: z.boolean(),
			unread: z.number().int(),
			sealsSeen: z.boolean(),
			lastMessageAt: z.string().nullable(),
		})
		.nullable(),
});
export type LetterSummary = z.infer<typeof LetterSummarySchema>;

export const CallProposalSchema = z.object({
	id: z.string(),
	proposedBy: z.enum(["rishta", "you", "them"]),
	slots: z.array(z.string()),
	timeZoneYou: z.string(),
	timeZoneThem: z.string(),
	availabilityYou: z.array(z.number().int()),
	availabilityThem: z.array(z.number().int()),
	status: z.enum(CALL_PROPOSAL_STATUSES),
	bookedSlot: z.string().nullable(),
	note: z.string().nullable(),
	createdAt: z.string(),
});
export type CallProposalView = z.infer<typeof CallProposalSchema>;

export const PhotoSchema = z.object({
	id: z.string(),
	position: z.number().int(),
	visibility: z.enum(PHOTO_VISIBILITIES),
	width: z.number().int(),
	height: z.number().int(),
	url: z.string(),
	veilUrl: z.string(),
});

export const OkSchema = z.object({ ok: z.literal(true) });
