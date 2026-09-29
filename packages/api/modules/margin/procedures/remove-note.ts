import { db, getMarginNoteById, marginNote } from "@repo/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { OkSchema } from "../../biodata/types";
import { getHouseholdRow } from "../../households/lib/context";

export const removeMarginNote = protectedProcedure
	.route({
		method: "DELETE",
		path: "/margin/{noteId}",
		tags: ["Margin"],
		summary: "Remove a pencil note",
		description: "Its author, or the household's owner.",
	})
	.input(z.object({ noteId: z.string() }))
	.output(OkSchema)
	.handler(async ({ input, context: { user } }) => {
		const { row: note, context } = await getHouseholdRow(
			await getMarginNoteById(input.noteId),
			user.id,
			"NOTE_NOT_FOUND",
		);
		if (note.authorUserId !== user.id && context.role !== "owner") {
			fail("FORBIDDEN", "ROLE_NOT_ALLOWED");
		}
		await db.delete(marginNote).where(eq(marginNote.id, note.id));
		return { ok: true as const };
	});
