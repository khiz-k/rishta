import { and, desc, eq, gte, lt, notInArray, sql } from "drizzle-orm";

import { db } from "../client";
import { profileView } from "../schema/postgres";

/** Who read a page, newest first, excluding the given users (blocks). */
export async function listReaders(params: {
	profileUserId: string;
	excludeUserIds: string[];
	before?: Date;
	limit: number;
}) {
	return db.query.profileView.findMany({
		where: and(
			eq(profileView.profileUserId, params.profileUserId),
			params.excludeUserIds.length > 0
				? notInArray(profileView.viewerUserId, params.excludeUserIds)
				: undefined,
			params.before ? lt(profileView.createdAt, params.before) : undefined,
		),
		orderBy: [desc(profileView.createdAt)],
		limit: params.limit,
	});
}

export async function countReadersSince(params: {
	profileUserId: string;
	since: Date;
	excludeUserIds: string[];
}) {
	const [row] = await db
		.select({ count: sql<number>`count(*)` })
		.from(profileView)
		.where(
			and(
				eq(profileView.profileUserId, params.profileUserId),
				gte(profileView.createdAt, params.since),
				params.excludeUserIds.length > 0
					? notInArray(profileView.viewerUserId, params.excludeUserIds)
					: undefined,
			),
		);
	return Number(row?.count ?? 0);
}

/** Records a read once per reader pair. */
export async function recordRead(values: {
	viewerUserId: string;
	viewerOrganizationId: string;
	profileUserId: string;
}) {
	const inserted = await db
		.insert(profileView)
		.values(values)
		.onConflictDoNothing()
		.returning({ id: profileView.id });
	return inserted.length > 0;
}
