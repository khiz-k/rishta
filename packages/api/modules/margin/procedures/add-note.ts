import { db, FAMILY_REACTIONS, marginNote } from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { MarginNoteSchema } from "../../biodata/types";
import { getHouseholdContext, memberLabelFor } from "../../households/lib/context";
import { notifyUser } from "../../notifications/lib/notify";
import { loadPageForViewer } from "../../profiles/lib/viewer";
import { toMarginNote } from "../lib/format";

export const addMarginNote = protectedProcedure
	.route({
		method: "POST",
		path: "/margin",
		tags: ["Margin"],
		summary: "Pencil a note beside a page",
		description:
			"Any household member. Proceed, Let's talk, Not for us, or a few words. It never changes a letter.",
	})
	.input(
		z
			.object({
				organizationId: z.string(),
				handle: z.string().min(4).max(12),
				reaction: z.enum(FAMILY_REACTIONS).optional(),
				text: z.string().trim().max(280).optional(),
			})
			.refine((value) => Boolean(value.reaction || value.text), {
				message: "Choose a reaction or add a few words",
			}),
	)
	.output(MarginNoteSchema)
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		const { page } = await loadPageForViewer(context, input.handle);

		const authorLabel = memberLabelFor(context.settings, user.id, user.name);
		const [created] = await db
			.insert(marginNote)
			.values({
				organizationId: input.organizationId,
				profileId: page.id,
				authorUserId: user.id,
				authorLabel,
				reaction: input.reaction ?? null,
				text: input.text && input.text.length > 0 ? input.text : null,
			})
			.returning();
		if (!created) {
			fail("INTERNAL_SERVER_ERROR", "NOTE_NOT_FOUND");
		}

		const candidateUserId = context.page?.userId;
		if (candidateUserId && candidateUserId !== user.id) {
			await notifyUser({
				userId: candidateUserId,
				copy: "FAMILY_REACTION",
				link: `/${context.slug}/folio/kept`,
				values: { author: authorLabel },
				email: false,
				data: { profileId: page.id },
			});
		}

		return toMarginNote(created, user.id);
	});
