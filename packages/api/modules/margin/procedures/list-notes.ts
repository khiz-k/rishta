import { getMarginNotes } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { MarginNoteSchema } from "../../biodata/types";
import { getHouseholdContext } from "../../households/lib/context";
import { loadPageForViewer } from "../../profiles/lib/viewer";
import { marginReaderOf, toMarginNotes } from "../lib/format";

export const listMarginNotes = protectedProcedure
	.route({
		method: "GET",
		path: "/margin",
		tags: ["Margin"],
		summary: "Pencil notes beside a page",
		description:
			"Any member who may read the page (family only if `familyReadsFolio`). The candidate's own notes are private to the candidate.",
	})
	.input(z.object({ organizationId: z.string(), handle: z.string().min(4).max(12) }))
	.output(z.array(MarginNoteSchema))
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		// Another household's page needs `canReadFolio`; the household's own page is always open.
		const { page } = await loadPageForViewer(context, input.handle);
		const notes = await getMarginNotes(context.organizationId, [page.id]);
		return toMarginNotes(notes, marginReaderOf(context));
	});
