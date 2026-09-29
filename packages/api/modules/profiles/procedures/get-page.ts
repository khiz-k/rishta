import {
	getHouseholdSetting,
	getKeptProfileUserIds,
	getMarginNotes,
	type InterestRow,
	type MatchRow,
} from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { toPageView } from "../../biodata/lib/page-view";
import { getHouseholdContext } from "../../households/lib/context";
import { isPriorityActive, letterStateFor } from "../../interests/lib/summary";
import { marginReaderOf, toMarginNotes } from "../../margin/lib/format";
import { loadPageForViewer, reasonsForViewer } from "../lib/viewer";
import { PageWithContextSchema } from "../types";

function toLetterRef(
	letter: (InterestRow & { match: MatchRow | null }) | null,
	viewerUserId: string,
) {
	if (!letter) {
		return null;
	}
	return {
		letterId: letter.id,
		state: letterStateFor(letter, viewerUserId, letter.match),
		isPriority: isPriorityActive(letter, new Date()),
		createdAt: letter.createdAt.toISOString(),
	};
}

export const getPage = protectedProcedure
	.route({
		method: "GET",
		path: "/profiles/page/{handle}",
		tags: ["Profiles"],
		summary: "Read one page",
		description:
			"A single page, redacted by relationship, with the reader's reasons, letters and pencil notes. Another household's page needs `familyReadsFolio` for guardians and family, who read it as a stranger would: letters, the sealed section and the candidate's own notes are the candidate's.",
	})
	.input(z.object({ handle: z.string().min(4).max(12), organizationId: z.string() }))
	.output(PageWithContextSchema)
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		// Scoped to the reader: for anyone but the candidate the relation carries no letters and
		// no match, so the view stays a stranger's and both letter refs are null.
		const { page, relation } = await loadPageForViewer(context, input.handle);
		const candidateUserId = context.page?.userId ?? user.id;

		const [view, reasons, kept, notes, targetSettings] = await Promise.all([
			toPageView(page, relation.relationship, {
				phoneShared: relation.match
					? relation.match.userAId === page.userId
						? relation.match.phoneSharedByA
						: relation.match.phoneSharedByB
					: false,
			}),
			reasonsForViewer(context, page),
			getKeptProfileUserIds(context.organizationId),
			getMarginNotes(context.organizationId, [page.id]),
			getHouseholdSetting(page.organizationId),
		]);

		return {
			...view,
			reasons,
			myLetter: toLetterRef(relation.myLetter, candidateUserId),
			theirLetter: toLetterRef(relation.theirLetter, candidateUserId),
			kept: page.userId ? kept.has(page.userId) : false,
			pencilNotes: toMarginNotes(notes, marginReaderOf(context)),
			familyLinksAllowed: targetSettings?.familyLinksAllowed ?? true,
		};
	});
