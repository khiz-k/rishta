import { biodataProfile, db, familyLink, interest, match, type ClosedReason } from "@repo/database";
import { and, eq, isNull, ne, or } from "drizzle-orm";

import { notifyUser } from "../../notifications/lib/notify";

export interface CloseSearchResult {
	declinedLetterIds: string[];
	withdrawnLetterIds: string[];
	closedMatches: Array<{ matchId: string; letterId: string; otherUserId: string }>;
}

/**
 * Engaged or "something else" (spec.md F13), in one transaction: close the page, answer waiting
 * letters kindly, take back sealed notes, close open introductions with the closing note, and
 * revoke family links. Then let everyone affected know, discreetly.
 */
export async function closeSearchForHousehold(params: {
	organizationId: string;
	candidateUserId: string;
	reason: Exclude<ClosedReason, "break">;
	closingNote: string;
}): Promise<CloseSearchResult> {
	const now = new Date();

	const result = await db.transaction(async (tx) => {
		await tx
			.update(biodataProfile)
			.set({ status: "closed", isActive: false, closedAt: now, closedReason: params.reason })
			.where(eq(biodataProfile.organizationId, params.organizationId));

		const declined = await tx
			.update(interest)
			.set({
				status: "declined",
				declineMode: "kind_note",
				declineNote: params.closingNote,
				respondedAt: now,
				closedAt: now,
			})
			.where(
				and(eq(interest.toUserId, params.candidateUserId), eq(interest.status, "pending")),
			)
			.returning({ id: interest.id });

		const withdrawn = await tx
			.update(interest)
			.set({ status: "withdrawn", closedAt: now })
			.where(
				and(
					eq(interest.fromUserId, params.candidateUserId),
					eq(interest.status, "pending"),
				),
			)
			.returning({ id: interest.id });

		const closed = await tx
			.update(match)
			.set({
				stage: "closed",
				closedAt: now,
				closedByUserId: params.candidateUserId,
				closingNote: params.closingNote,
				closeReason: "search_closed",
			})
			.where(
				and(
					ne(match.stage, "closed"),
					or(
						eq(match.userAId, params.candidateUserId),
						eq(match.userBId, params.candidateUserId),
					),
				),
			)
			.returning({
				id: match.id,
				interestId: match.interestId,
				userAId: match.userAId,
				userBId: match.userBId,
			});

		await tx
			.update(familyLink)
			.set({ revokedAt: now })
			.where(
				and(
					eq(familyLink.organizationId, params.organizationId),
					isNull(familyLink.revokedAt),
				),
			);

		return {
			declinedLetterIds: declined.map((row) => row.id),
			withdrawnLetterIds: withdrawn.map((row) => row.id),
			closedMatches: closed.map((row) => ({
				matchId: row.id,
				letterId: row.interestId,
				otherUserId: row.userAId === params.candidateUserId ? row.userBId : row.userAId,
			})),
		};
	});

	const declinedLetters =
		result.declinedLetterIds.length > 0
			? await db.query.interest.findMany({
					where: (letter, { inArray }) => inArray(letter.id, result.declinedLetterIds),
					columns: { id: true, fromUserId: true },
				})
			: [];

	await Promise.all([
		...declinedLetters.map((letter) =>
			notifyUser({
				userId: letter.fromUserId,
				copy: "LETTER_ANSWERED",
				link: `/letters/${letter.id}`,
				email: false,
				data: { letterId: letter.id },
			}),
		),
		...result.closedMatches.map((closedMatch) =>
			notifyUser({
				userId: closedMatch.otherUserId,
				copy: "INTRODUCTION_CLOSED",
				link: `/letters/${closedMatch.letterId}`,
				email: true,
				data: { letterId: closedMatch.letterId },
			}),
		),
	]);

	return result;
}
