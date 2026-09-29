import {
	blockUser,
	db,
	findBlock,
	getPageByHandle,
	interest,
	match,
	normalizeHandle,
	shortlist,
} from "@repo/database";
import { toPairKey } from "@repo/database";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { requireCandidate } from "../../households/lib/context";

/**
 * Blocks (or unblocks) another candidate, both ways: their page, letters, messages, readers
 * entries and family links disappear for each other. Pending letters close quietly and an
 * open introduction closes.
 */
export async function blockCandidate(params: {
	organizationId: string;
	blockerUserId: string;
	blockedUserId: string;
	reason?: string | null;
}) {
	const now = new Date();
	await db.transaction(async (tx) => {
		await tx
			.insert(blockUser)
			.values({
				blockerUserId: params.blockerUserId,
				blockedUserId: params.blockedUserId,
				organizationId: params.organizationId,
				reason: params.reason ?? null,
			})
			.onConflictDoNothing();

		// Letters to me close quietly; letters from me close.
		await tx
			.update(interest)
			.set({ status: "declined", declineMode: "quiet", respondedAt: now, closedAt: now })
			.where(
				and(
					eq(interest.fromUserId, params.blockedUserId),
					eq(interest.toUserId, params.blockerUserId),
					eq(interest.status, "pending"),
				),
			);
		await tx
			.update(interest)
			.set({ status: "closed", closedAt: now })
			.where(
				and(
					eq(interest.fromUserId, params.blockerUserId),
					eq(interest.toUserId, params.blockedUserId),
					eq(interest.status, "pending"),
				),
			);

		await tx
			.update(match)
			.set({
				stage: "closed",
				closedAt: now,
				closedByUserId: params.blockerUserId,
				closeReason: "other",
			})
			.where(
				and(
					eq(match.pairKey, toPairKey(params.blockerUserId, params.blockedUserId)),
					ne(match.stage, "closed"),
				),
			);

		await tx
			.delete(shortlist)
			.where(
				and(
					eq(shortlist.organizationId, params.organizationId),
					eq(shortlist.profileUserId, params.blockedUserId),
				),
			);
	});
}

export const blockUserProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/profiles/block",
		tags: ["Profiles"],
		summary: "Block or unblock someone",
	})
	.input(
		z
			.object({
				organizationId: z.string(),
				handle: z.string().optional(),
				blockedUserId: z.string().optional(),
				reason: z.string().trim().max(400).optional(),
			})
			.refine((value) => Boolean(value.handle || value.blockedUserId), {
				message: "Give a handle or a user id",
			}),
	)
	.output(z.object({ blocked: z.boolean() }))
	.handler(async ({ input, context: { user } }) => {
		await requireCandidate(input.organizationId, user.id);

		let blockedUserId = input.blockedUserId ?? null;
		if (input.handle) {
			const page = await getPageByHandle(normalizeHandle(input.handle));
			blockedUserId = page?.userId ?? null;
		}
		if (!blockedUserId || blockedUserId === user.id) {
			fail("NOT_FOUND", "PAGE_NOT_FOUND");
		}

		const existing = await findBlock(user.id, blockedUserId);
		if (existing) {
			await db.delete(blockUser).where(eq(blockUser.id, existing.id));
			return { blocked: false };
		}

		await blockCandidate({
			organizationId: input.organizationId,
			blockerUserId: user.id,
			blockedUserId,
			reason: input.reason,
		});
		return { blocked: true };
	});
