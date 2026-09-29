import {
	getBlockedUserIdsEitherWay,
	getKeptProfileUserIds,
	getLettersByPartner,
	getMarginNotes,
	getPagesByIds,
	type FolioPageRow,
} from "@repo/database";

import { toPageView } from "../../biodata/lib/page-view";
import { relationshipFromLetters } from "../../biodata/lib/relationship";
import { letterReaderUserId, type HouseholdContext } from "../../households/lib/context";
import { isPriorityActive, letterStateFor } from "../../interests/lib/summary";
import { groupMarginNotes, marginReaderOf } from "../../margin/lib/format";

/**
 * Turns stored folio pages into what the reader sees: each page redacted for the reader, with
 * its reasons and pencil notes. The stored score is never read here. The candidate's letters
 * are read only when the candidate is the reader (spec.md F7, §13): a guardian or family member
 * gets every page as a stranger would, with no letter state and none of the candidate's own
 * pencil notes.
 */
export async function presentFolioPages(context: HouseholdContext, rows: FolioPageRow[]) {
	const candidateUserId = context.page?.userId ?? null;
	const letterReader = letterReaderUserId(context);
	const profileIds = rows.map((row) => row.profileId);

	const [pages, blocked, kept, notes] = await Promise.all([
		getPagesByIds(profileIds),
		candidateUserId
			? getBlockedUserIdsEitherWay(candidateUserId)
			: Promise.resolve(new Set<string>()),
		getKeptProfileUserIds(context.organizationId),
		getMarginNotes(context.organizationId, profileIds),
	]);
	const pagesById = new Map(pages.map((page) => [page.id, page]));
	const lettersByPartner = letterReader
		? await getLettersByPartner(
				letterReader,
				pages.map((page) => page.userId).filter((id): id is string => Boolean(id)),
			)
		: null;
	const notesByProfile = groupMarginNotes(notes, marginReaderOf(context));
	const now = new Date();

	return Promise.all(
		rows.map(async (row) => {
			const page = pagesById.get(row.profileId);
			const base = {
				folioPageId: row.id,
				position: row.position,
				state: row.state,
				seenBefore: row.seenBefore,
				reasons: row.reasons,
				pencilNotes: notesByProfile.get(row.profileId) ?? [],
			};

			const closed =
				!page || !page.userId || page.status !== "active" || blocked.has(page.userId);
			if (closed || !page?.userId) {
				return { ...base, page: null, kept: false, myLetter: null, reasons: [] };
			}

			const letters = lettersByPartner?.get(page.userId) ?? [];
			const myLetter = letters.find((letter) => letter.fromUserId === letterReader) ?? null;
			const theirLetter = letters.find((letter) => letter.fromUserId === page.userId) ?? null;
			const match = myLetter?.match ?? theirLetter?.match ?? null;
			const relationship = relationshipFromLetters({ myLetter, theirLetter, match });

			return {
				...base,
				page: await toPageView(page, relationship),
				kept: kept.has(page.userId),
				myLetter: myLetter
					? {
							letterId: myLetter.id,
							state: letterStateFor(myLetter, letterReader ?? "", myLetter.match),
							isPriority: isPriorityActive(myLetter, now),
							createdAt: myLetter.createdAt.toISOString(),
						}
					: null,
			};
		}),
	);
}
