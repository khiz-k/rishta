import { and, asc, desc, eq, inArray, lt, ne, or, sql } from "drizzle-orm";

import { db } from "../client";
import { callProposal, match, message } from "../schema/postgres";

/** A stable key for a pair of candidates, so a pair can never have a second introduction. */
export function toPairKey(userId: string, otherUserId: string) {
	return [userId, otherUserId].sort().join(":");
}

export async function getMatchById(matchId: string) {
	return db.query.match.findFirst({
		where: eq(match.id, matchId),
		with: {
			interest: true,
			proposals: { orderBy: [desc(callProposal.createdAt)] },
		},
	});
}

export async function getMatchByPair(userId: string, otherUserId: string) {
	return db.query.match.findFirst({
		where: eq(match.pairKey, toPairKey(userId, otherUserId)),
	});
}

/** Introductions a candidate takes part in, with the letter and the proposals. */
export async function getMatchesForUser(userId: string, options: { includeClosed?: boolean } = {}) {
	return db.query.match.findMany({
		where: and(
			or(eq(match.userAId, userId), eq(match.userBId, userId)),
			options.includeClosed ? undefined : ne(match.stage, "closed"),
		),
		with: {
			interest: true,
			proposals: { orderBy: [desc(callProposal.createdAt)] },
		},
		orderBy: [desc(match.createdAt)],
	});
}

export async function getProposalById(proposalId: string) {
	return db.query.callProposal.findFirst({
		where: eq(callProposal.id, proposalId),
		with: { match: true },
	});
}

export async function listMessagesForMatch(params: {
	matchId: string;
	before?: Date;
	limit: number;
}) {
	const rows = await db.query.message.findMany({
		where: and(
			eq(message.matchId, params.matchId),
			params.before ? lt(message.createdAt, params.before) : undefined,
		),
		orderBy: [desc(message.createdAt)],
		limit: params.limit + 1,
	});
	const hasMore = rows.length > params.limit;
	const page = rows.slice(0, params.limit).reverse();
	return { items: page, hasMore };
}

export async function countMessagesInMatch(matchId: string) {
	const [row] = await db
		.select({ count: sql<number>`count(*)` })
		.from(message)
		.where(eq(message.matchId, matchId));
	return Number(row?.count ?? 0);
}

/** Unread messages to a user, grouped by introduction. */
export async function countUnreadByMatch(userId: string, matchIds: string[]) {
	if (matchIds.length === 0) {
		return new Map<string, number>();
	}
	const rows = await db
		.select({ matchId: message.matchId, count: sql<number>`count(*)` })
		.from(message)
		.where(
			and(
				eq(message.toUserId, userId),
				eq(message.read, false),
				inArray(message.matchId, matchIds),
			),
		)
		.groupBy(message.matchId);
	return new Map(rows.map((row) => [row.matchId, Number(row.count)]));
}

export async function countUnreadMessages(userId: string) {
	const [row] = await db
		.select({ count: sql<number>`count(*)` })
		.from(message)
		.where(and(eq(message.toUserId, userId), eq(message.read, false)));
	return Number(row?.count ?? 0);
}

/** The last message each side wrote, for the quiet "Read" line and the 7-day nudge. */
export async function getLatestMessage(matchId: string) {
	return db.query.message.findFirst({
		where: eq(message.matchId, matchId),
		orderBy: [desc(message.createdAt)],
	});
}

export async function getOpenProposals(matchId: string) {
	return db.query.callProposal.findMany({
		where: and(eq(callProposal.matchId, matchId), eq(callProposal.status, "open")),
		orderBy: [asc(callProposal.createdAt)],
	});
}

export async function getProposalsForMatches(matchIds: string[]) {
	if (matchIds.length === 0) {
		return [];
	}
	return db.query.callProposal.findMany({
		where: inArray(callProposal.matchId, matchIds),
		orderBy: [desc(callProposal.createdAt)],
	});
}
