import { FOLIO_PAGE_STATES } from "@repo/database";
import { z } from "zod";

import { FitReasonSchema, MarginNoteSchema, PageViewSchema } from "../biodata/types";
import { LetterRefSchema } from "../profiles/types";

export const FolioViewerSchema = z.object({
	role: z.enum(["owner", "admin", "member"]),
	isCandidate: z.boolean(),
	candidateFirstName: z.string(),
});

export const FolioPageViewSchema = z.object({
	folioPageId: z.string(),
	position: z.number().int(),
	state: z.enum(FOLIO_PAGE_STATES),
	seenBefore: z.boolean(),
	/** Null when the page closed mid-read (blocked, paused, closed): "This page has been closed by its family." */
	page: PageViewSchema.nullable(),
	reasons: z.array(FitReasonSchema),
	pencilNotes: z.array(MarginNoteSchema),
	kept: z.boolean(),
	myLetter: LetterRefSchema.nullable(),
});

export const FolioTodaySchema = z.object({
	releaseDate: z.string().nullable(),
	nextReleaseAt: z.string(),
	size: z.number().int(),
	locked: z.enum(["awaiting_claim", "unpublished", "paused", "closed"]).nullable(),
	/** Before the first release: "Your first folio arrives this evening at 7." */
	firstRelease: z.boolean(),
	viewer: FolioViewerSchema,
	pages: z.array(FolioPageViewSchema),
});

export const KeptPageSchema = z.object({
	page: PageViewSchema,
	keptBy: z.string(),
	keptAt: z.string(),
	pencilNotes: z.array(MarginNoteSchema),
	myLetter: LetterRefSchema.nullable(),
	reasons: z.array(FitReasonSchema),
});
