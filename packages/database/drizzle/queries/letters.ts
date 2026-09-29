import { and, desc, eq, gte, inArray, lt, or, sql } from "drizzle-orm";

import { db } from "../client";
import { interest, match, noteSuggestion } from "../schema/postgres";

/** Days after which an unanswered letter closes by itself (spec.md F7). */
export const LETTER_AUTO_CLOSE_DAYS = 30;

export async function getLetterById(letterId: string) {
	return db.query.interest.findFirst({
		where: eq(interest.id, letterId),
		with: { match: true },
	});
}

/** Any letter between two candidates, in either direction. */
export async function getLettersBetweenUsers(userId: string, otherUserId: string) {
	return db.query.interest.findMany({
		where: or(
			and(eq(interest.fromUserId, userId), eq(interest.toUserId, otherUserId)),
			and(eq(interest.fromUserId, otherUserId), eq(interest.toUserId, userId)),
		),
		with: { match: true },
	});
}

/**
 * Every letter between one candidate and several others, in either direction, grouped by the
 * other person's user id: one query for a whole folio or kept list instead of one per page.
 */
export async function getLettersByPartner(userId: string, otherUserIds: string[]) {
	const byPartner = new Map<string, Awaited<ReturnType<typeof getLettersBetweenUsers>>>();
	if (otherUserIds.length === 0) {
		return byPartner;
	}
	const rows = await db.query.interest.findMany({
		where: or(
			and(eq(interest.fromUserId, userId), inArray(interest.toUserId, otherUserIds)),
			and(inArray(interest.fromUserId, otherUserIds), eq(interest.toUserId, userId)),
		),
		with: { match: true },
	});
	for (const row of rows) {
		const partnerId = row.fromUserId === userId ? row.toUserId : row.fromUserId;
		const list = byPartner.get(partnerId) ?? [];
		list.push(row);
		byPartner.set(partnerId, list);
	}
	return byPartner;
}

/** Every candidate this user has a letter with, in either direction and in any state. */
export async function getLetterPartnerIds(userId: string) {
	const rows = await db
		.select({ fromUserId: interest.fromUserId, toUserId: interest.toUserId })
		.from(interest)
		.where(or(eq(interest.fromUserId, userId), eq(interest.toUserId, userId)));

	const ids = new Set<string>();
	for (const row of rows) {
		ids.add(row.fromUserId === userId ? row.toUserId : row.fromUserId);
	}
	return ids;
}

/** Letters a household sealed since an instant (the household-local day start). */
export async function countLettersSentSince(organizationId: string, since: Date) {
	const [row] = await db
		.select({ count: sql<number>`count(*)` })
		.from(interest)
		.where(
			and(eq(interest.fromOrganizationId, organizationId), gte(interest.createdAt, since)),
		);
	return Number(row?.count ?? 0);
}

/**
 * Closes pending letters older than 30 days that involve the household, lazily on read, so
 * nobody is left guessing. Returns the number closed.
 */
export async function closeExpiredLetters(organizationId: string, now = new Date()) {
	const cutoff = new Date(now.getTime() - LETTER_AUTO_CLOSE_DAYS * 24 * 60 * 60 * 1000);
	const closed = await db
		.update(interest)
		.set({ status: "closed", closedAt: now })
		.where(
			and(
				eq(interest.status, "pending"),
				lt(interest.createdAt, cutoff),
				or(
					eq(interest.fromOrganizationId, organizationId),
					eq(interest.toOrganizationId, organizationId),
				),
			),
		)
		.returning({ id: interest.id });
	return closed.length;
}

/** All letters sent or received by a household, newest first, with their introduction. */
export async function getLettersForOrganization(organizationId: string) {
	return db.query.interest.findMany({
		where: or(
			eq(interest.fromOrganizationId, organizationId),
			eq(interest.toOrganizationId, organizationId),
		),
		with: { match: true },
		orderBy: [desc(interest.createdAt)],
	});
}

export async function countPendingLettersTo(organizationId: string) {
	const [row] = await db
		.select({ count: sql<number>`count(*)` })
		.from(interest)
		.where(and(eq(interest.toOrganizationId, organizationId), eq(interest.status, "pending")));
	return Number(row?.count ?? 0);
}

export async function getSuggestionLines(organizationId: string, toProfileId: string) {
	return db.query.noteSuggestion.findMany({
		where: and(
			eq(noteSuggestion.organizationId, organizationId),
			eq(noteSuggestion.toProfileId, toProfileId),
		),
		columns: { id: true, line: true },
	});
}

export async function createNoteSuggestion(values: typeof noteSuggestion.$inferInsert) {
	const [created] = await db.insert(noteSuggestion).values(values).returning();
	return created;
}

export async function getMatchesByInterestIds(interestIds: string[]) {
	if (interestIds.length === 0) {
		return [];
	}
	return db.query.match.findMany({ where: inArray(match.interestId, interestIds) });
}
