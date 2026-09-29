import { and, eq, or } from "drizzle-orm";

import { db } from "../client";
import { blockUser } from "../schema/postgres";

/** Everyone this user has blocked or been blocked by. Blocks hide everything in both directions. */
export async function getBlockedUserIdsEitherWay(userId: string) {
	const rows = await db.query.blockUser.findMany({
		where: or(eq(blockUser.blockerUserId, userId), eq(blockUser.blockedUserId, userId)),
		columns: { blockerUserId: true, blockedUserId: true },
	});

	const ids = new Set<string>();
	for (const row of rows) {
		ids.add(row.blockerUserId === userId ? row.blockedUserId : row.blockerUserId);
	}
	return ids;
}

export async function isBlockedEitherWay(userId: string, otherUserId: string) {
	const row = await db.query.blockUser.findFirst({
		where: or(
			and(eq(blockUser.blockerUserId, userId), eq(blockUser.blockedUserId, otherUserId)),
			and(eq(blockUser.blockerUserId, otherUserId), eq(blockUser.blockedUserId, userId)),
		),
		columns: { id: true },
	});
	return Boolean(row);
}

export async function findBlock(blockerUserId: string, blockedUserId: string) {
	return db.query.blockUser.findFirst({
		where: and(
			eq(blockUser.blockerUserId, blockerUserId),
			eq(blockUser.blockedUserId, blockedUserId),
		),
	});
}
