import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "../client";
import { marginNote } from "../schema/postgres";

/** Pencil notes in a household's margin beside the given pages, newest first. */
export async function getMarginNotes(organizationId: string, profileIds: string[]) {
	if (profileIds.length === 0) {
		return [];
	}
	return db.query.marginNote.findMany({
		where: and(
			eq(marginNote.organizationId, organizationId),
			inArray(marginNote.profileId, profileIds),
		),
		orderBy: [desc(marginNote.updatedAt)],
	});
}

export async function getMarginNoteById(noteId: string) {
	return db.query.marginNote.findFirst({ where: eq(marginNote.id, noteId) });
}

export async function getLinkReaction(familyLinkId: string, profileId: string) {
	return db.query.marginNote.findFirst({
		where: and(eq(marginNote.familyLinkId, familyLinkId), eq(marginNote.profileId, profileId)),
	});
}

/** One reaction per family link and page; changing it updates the same pencil note. */
export async function upsertLinkReaction(values: {
	organizationId: string;
	profileId: string;
	familyLinkId: string;
	authorLabel: string;
	reaction: (typeof marginNote.$inferInsert)["reaction"];
	text: string | null;
}) {
	const [row] = await db
		.insert(marginNote)
		.values(values)
		.onConflictDoUpdate({
			target: [marginNote.familyLinkId, marginNote.profileId],
			set: { reaction: values.reaction, text: values.text, updatedAt: new Date() },
		})
		.returning();
	return row;
}
