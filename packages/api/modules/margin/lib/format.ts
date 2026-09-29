import type { MarginNoteRow } from "@repo/database";

import type { MarginNote } from "../../biodata/types";
import type { HouseholdContext } from "../../households/lib/context";

/** Who reads a household's margin: the signed-in member, and the household's candidate. */
export interface MarginReader {
	userId: string;
	/** The claimed page's candidate; null before the claim. */
	candidateUserId: string | null;
}

export function marginReaderOf(context: HouseholdContext): MarginReader {
	return { userId: context.userId, candidateUserId: context.page?.userId ?? null };
}

/**
 * The candidate's own pencil notes are private notes to self (spec.md §13); every other note
 * (a guardian's, family's, a family link's) belongs to the whole household. So a note the
 * candidate wrote reaches the candidate only, and is filtered here, on the server.
 */
export function isReadableBy(row: MarginNoteRow, reader: MarginReader) {
	if (!reader.candidateUserId || row.authorUserId !== reader.candidateUserId) {
		return true;
	}
	return reader.userId === reader.candidateUserId;
}

/** A pencil note as the household sees it, signed "Ammi" (the UI adds "via link"). */
export function toMarginNote(row: MarginNoteRow, viewerUserId: string): MarginNote {
	return {
		id: row.id,
		authorLabel: row.authorLabel,
		via: row.familyLinkId ? "link" : "app",
		reaction: row.reaction,
		text: row.text,
		isMine: row.authorUserId === viewerUserId,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

/** The notes beside a page that this reader may see, in their stored order. */
export function toMarginNotes(rows: MarginNoteRow[], reader: MarginReader): MarginNote[] {
	return rows
		.filter((row) => isReadableBy(row, reader))
		.map((row) => toMarginNote(row, reader.userId));
}

export function groupMarginNotes(rows: MarginNoteRow[], reader: MarginReader) {
	const byProfile = new Map<string, MarginNote[]>();
	for (const row of rows) {
		if (!isReadableBy(row, reader)) {
			continue;
		}
		const list = byProfile.get(row.profileId) ?? [];
		list.push(toMarginNote(row, reader.userId));
		byProfile.set(row.profileId, list);
	}
	return byProfile;
}
