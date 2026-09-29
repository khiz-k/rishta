import {
	getBlockedUserIdsEitherWay,
	getKeptPages,
	getLettersByPartner,
	getMarginNotes,
	getPagesByUserIds,
	getPreferencesByOrganizationIds,
	getPreferenceByOrganizationId,
	user as userTable,
	db,
} from "@repo/database";
import { inArray } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { toPageView } from "../../biodata/lib/page-view";
import { relationshipFromLetters } from "../../biodata/lib/relationship";
import {
	canReadFolio,
	getHouseholdContext,
	letterReaderUserId,
	memberLabelFor,
} from "../../households/lib/context";
import { isPriorityActive, letterStateFor } from "../../interests/lib/summary";
import { groupMarginNotes, marginReaderOf } from "../../margin/lib/format";
import { evaluateFit, selectReasons } from "../lib/fit";
import { KeptPageSchema } from "../types";

export const getKept = protectedProcedure
	.route({
		method: "GET",
		path: "/folio/kept",
		tags: ["Folio"],
		summary: "Kept pages",
		description:
			"Pages kept to read again and to discuss with family, newest first, with every pencil note the reader may see. Guardians and family (only if `familyReadsFolio`) read them as a stranger would: letters are the candidate's.",
	})
	.input(z.object({ organizationId: z.string() }))
	.output(z.array(KeptPageSchema))
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		if (!canReadFolio(context)) {
			fail("FORBIDDEN", "ROLE_NOT_ALLOWED");
		}
		const candidateUserId = context.page?.userId ?? null;
		// The candidate's letters, only when the candidate reads (spec.md F7, §13).
		const letterReader = letterReaderUserId(context);

		const kept = await getKeptPages(input.organizationId);
		const [pages, blocked, readerPreference] = await Promise.all([
			getPagesByUserIds(kept.map((row) => row.profileUserId)),
			candidateUserId
				? getBlockedUserIdsEitherWay(candidateUserId)
				: Promise.resolve(new Set<string>()),
			getPreferenceByOrganizationId(input.organizationId),
		]);
		const visible = pages.filter(
			(page) => page.userId && page.status === "active" && !blocked.has(page.userId),
		);
		const byUser = new Map(visible.map((page) => [page.userId, page]));

		// Older rows have no keeper; they were kept by the row's own user.
		const keeperOf = (row: (typeof kept)[number]) => row.keptByUserId ?? row.userId;
		const keeperIds = [...new Set(kept.map(keeperOf))];
		const [keepers, notes, targetPreferences, lettersByPartner] = await Promise.all([
			keeperIds.length > 0
				? db.query.user.findMany({
						where: inArray(userTable.id, keeperIds),
						columns: { id: true, name: true },
					})
				: Promise.resolve([]),
			getMarginNotes(
				input.organizationId,
				visible.map((page) => page.id),
			),
			getPreferencesByOrganizationIds(visible.map((page) => page.organizationId)),
			letterReader
				? getLettersByPartner(
						letterReader,
						visible
							.map((page) => page.userId)
							.filter((id): id is string => Boolean(id)),
					)
				: Promise.resolve(null),
		]);
		const keeperNames = new Map(keepers.map((keeper) => [keeper.id, keeper.name]));
		const notesByProfile = groupMarginNotes(notes, marginReaderOf(context));
		const preferenceByOrg = new Map(
			targetPreferences.map((preference) => [preference.organizationId, preference]),
		);
		const now = new Date();

		const rows = kept.flatMap((row) => {
			const page = byUser.get(row.profileUserId);
			return page?.userId ? [{ row, page, pageUserId: page.userId }] : [];
		});

		return Promise.all(
			rows.map(async ({ row, page, pageUserId }) => {
				const letters = lettersByPartner?.get(pageUserId) ?? [];
				const myLetter =
					letters.find((letter) => letter.fromUserId === letterReader) ?? null;
				const theirLetter =
					letters.find((letter) => letter.fromUserId === pageUserId) ?? null;
				const relationship = relationshipFromLetters({
					myLetter,
					theirLetter,
					match: myLetter?.match ?? theirLetter?.match ?? null,
				});

				const reasons =
					context.page && readerPreference
						? selectReasons(
								evaluateFit(
									{ page: context.page, preference: readerPreference },
									{
										page,
										preference:
											preferenceByOrg.get(page.organizationId) ?? null,
										photoVisibilities: page.photos.map(
											(photo) => photo.visibility,
										),
									},
									now,
								),
								readerPreference.dealbreakers,
							)
						: [];

				return {
					page: await toPageView(page, relationship),
					keptBy: memberLabelFor(
						context.settings,
						keeperOf(row),
						keeperNames.get(keeperOf(row)),
					),
					keptAt: row.createdAt.toISOString(),
					pencilNotes: notesByProfile.get(page.id) ?? [],
					myLetter: myLetter
						? {
								letterId: myLetter.id,
								state: letterStateFor(myLetter, letterReader ?? "", myLetter.match),
								isPriority: isPriorityActive(myLetter, now),
								createdAt: myLetter.createdAt.toISOString(),
							}
						: null,
					reasons,
				};
			}),
		);
	});
