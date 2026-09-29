import { BiodataProfileSchema } from "@repo/database";
import { z } from "zod";

import {
	FitReasonSchema,
	LETTER_STATES,
	MarginNoteSchema,
	PageViewSchema,
	PhotoSchema,
	SECTION_IDS,
} from "../biodata/types";

export { FieldVisibilityMapSchema } from "@repo/database";

export const OwnerPageSchema = BiodataProfileSchema;

export const CompletenessSchema = z.record(
	z.enum(SECTION_IDS),
	z.object({ filled: z.number().int(), total: z.number().int() }),
);

export const MyPageSchema = z.object({
	page: OwnerPageSchema,
	photos: z.array(PhotoSchema),
	completeness: CompletenessSchema,
	missingForPublish: z.array(z.string()),
	canEdit: z.boolean(),
	/** "4 this week" in the margin; the candidate only. */
	readersThisWeek: z.number().int().nullable(),
	view: PageViewSchema,
});

export const LetterRefSchema = z.object({
	letterId: z.string(),
	state: z.enum(LETTER_STATES),
	isPriority: z.boolean(),
	createdAt: z.string(),
});

export const PageWithContextSchema = PageViewSchema.extend({
	reasons: z.array(FitReasonSchema),
	myLetter: LetterRefSchema.nullable(),
	theirLetter: LetterRefSchema.nullable(),
	kept: z.boolean(),
	pencilNotes: z.array(MarginNoteSchema),
	familyLinksAllowed: z.boolean(),
});
