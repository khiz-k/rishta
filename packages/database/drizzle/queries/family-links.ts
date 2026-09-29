import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";

import { db } from "../client";
import { familyLink } from "../schema/postgres";

export async function getFamilyLinkByTokenHash(tokenHash: string) {
	return db.query.familyLink.findFirst({
		where: eq(familyLink.tokenHash, tokenHash),
		with: { profile: true, letter: true },
	});
}

export async function getFamilyLinkById(linkId: string) {
	return db.query.familyLink.findFirst({ where: eq(familyLink.id, linkId) });
}

export async function listFamilyLinks(organizationId: string) {
	return db.query.familyLink.findMany({
		where: eq(familyLink.organizationId, organizationId),
		with: { profile: { columns: { displayName: true, handle: true } } },
		orderBy: [desc(familyLink.createdAt)],
	});
}

export async function countActiveFamilyLinks(organizationId: string, now = new Date()) {
	const [row] = await db
		.select({ count: sql<number>`count(*)` })
		.from(familyLink)
		.where(
			and(
				eq(familyLink.organizationId, organizationId),
				isNull(familyLink.revokedAt),
				gt(familyLink.expiresAt, now),
			),
		);
	return Number(row?.count ?? 0);
}

/** Counts an open of a family link. */
export async function recordFamilyLinkOpen(linkId: string, now = new Date()) {
	await db
		.update(familyLink)
		.set({
			openCount: sql`${familyLink.openCount} + 1`,
			firstOpenedAt: sql`COALESCE(${familyLink.firstOpenedAt}, ${now})`,
			lastOpenedAt: now,
		})
		.where(eq(familyLink.id, linkId));
}
