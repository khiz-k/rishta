import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";

import { db } from "../client";
import { folio, folioPage, shortlist } from "../schema/postgres";

export async function getFolioForDate(organizationId: string, releaseDate: string) {
	return db.query.folio.findFirst({
		where: and(eq(folio.organizationId, organizationId), eq(folio.releaseDate, releaseDate)),
		with: { pages: { orderBy: [asc(folioPage.position)] } },
	});
}

export async function getLatestFolio(organizationId: string) {
	return db.query.folio.findFirst({
		where: eq(folio.organizationId, organizationId),
		orderBy: [desc(folio.releaseDate)],
		with: { pages: { orderBy: [asc(folioPage.position)] } },
	});
}

export async function getFolioPageById(folioPageId: string) {
	return db.query.folioPage.findFirst({
		where: eq(folioPage.id, folioPageId),
		with: { folio: true },
	});
}

/** Every earlier appearance of the given pages in a household's folios. */
export async function getFolioHistory(organizationId: string, profileIds: string[]) {
	if (profileIds.length === 0) {
		return [];
	}
	return db
		.select({
			profileId: folioPage.profileId,
			state: folioPage.state,
			answeredAt: folioPage.answeredAt,
			createdAt: folioPage.createdAt,
		})
		.from(folioPage)
		.where(
			and(
				eq(folioPage.organizationId, organizationId),
				inArray(folioPage.profileId, profileIds),
			),
		);
}

/** How many folios each page has appeared in since an instant (the exposure cap, §7 rule 6). */
export async function countExposuresSince(profileIds: string[], since: Date) {
	if (profileIds.length === 0) {
		return new Map<string, number>();
	}
	const rows = await db
		.select({ profileId: folioPage.profileId, count: sql<number>`count(*)` })
		.from(folioPage)
		.where(and(inArray(folioPage.profileId, profileIds), gte(folioPage.createdAt, since)))
		.groupBy(folioPage.profileId);
	return new Map(rows.map((row) => [row.profileId, Number(row.count)]));
}

/** Kept pages for a household, newest first. */
export async function getKeptPages(organizationId: string) {
	return db.query.shortlist.findMany({
		where: eq(shortlist.organizationId, organizationId),
		orderBy: [desc(shortlist.createdAt)],
	});
}

export async function getKeptProfileUserIds(organizationId: string) {
	const rows = await db
		.select({ profileUserId: shortlist.profileUserId })
		.from(shortlist)
		.where(eq(shortlist.organizationId, organizationId));
	return new Set(rows.map((row) => row.profileUserId));
}
