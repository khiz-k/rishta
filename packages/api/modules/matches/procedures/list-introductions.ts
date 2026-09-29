import {
	countUnreadByMatch,
	getBlockedUserIdsEitherWay,
	getMatchesForUser,
	getPagesByUserIds,
} from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { requireCandidate } from "../../households/lib/context";
import { isYourMove } from "../../interests/lib/summary";
import { IntroductionSummarySchema } from "../types";

export async function listIntroductionsFor(organizationId: string, userId: string) {
	await requireCandidate(organizationId, userId);

	const [matches, blocked] = await Promise.all([
		getMatchesForUser(userId, { includeClosed: true }),
		getBlockedUserIdsEitherWay(userId),
	]);
	const visible = matches.filter(
		(row) => !blocked.has(row.userAId === userId ? row.userBId : row.userAId),
	);
	const otherIds = visible.map((row) => (row.userAId === userId ? row.userBId : row.userAId));
	const [pages, unread] = await Promise.all([
		getPagesByUserIds(otherIds),
		countUnreadByMatch(
			userId,
			visible.map((row) => row.id),
		),
	]);
	const pageByUser = new Map(pages.map((page) => [page.userId, page]));

	return visible.map((row) => {
		const otherPage = pageByUser.get(row.userAId === userId ? row.userBId : row.userAId);
		const openProposal = row.proposals.find((proposal) => proposal.status === "open") ?? null;
		const booked = row.proposals.find((proposal) => proposal.status === "booked") ?? null;
		const unreadCount = unread.get(row.id) ?? 0;
		return {
			id: row.id,
			letterId: row.interestId,
			stage: row.stage,
			otherHandle: otherPage?.handle ?? "",
			otherName: otherPage?.fullName ?? otherPage?.displayName ?? "",
			otherCity: otherPage?.location ?? null,
			bookedSlot: booked?.bookedSlot?.toISOString() ?? null,
			lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
			unread: unreadCount,
			yourMove: isYourMove({
				match: row,
				viewerUserId: userId,
				openProposal,
				unread: unreadCount,
			}),
			sealsSeen: (row.userAId === userId ? row.sealsSeenByAAt : row.sealsSeenByBAt) !== null,
			closedAt: row.closedAt?.toISOString() ?? null,
		};
	});
}

const input = z.object({ organizationId: z.string() });
const output = z.array(IntroductionSummarySchema);

export const listIntroductions = protectedProcedure
	.route({
		method: "GET",
		path: "/matches",
		tags: ["Introductions"],
		summary: "Introductions",
	})
	.input(input)
	.output(output)
	.handler(async ({ input: { organizationId }, context: { user } }) =>
		listIntroductionsFor(organizationId, user.id),
	);

/** `interests.matches` stays as an alias of `matches.list` during the migration. */
export const listMatchesAlias = protectedProcedure
	.route({
		method: "GET",
		path: "/interests/matches",
		tags: ["Letters"],
		summary: "Introductions (alias of matches.list)",
		deprecated: true,
	})
	.input(input)
	.output(output)
	.handler(async ({ input: { organizationId }, context: { user } }) =>
		listIntroductionsFor(organizationId, user.id),
	);
