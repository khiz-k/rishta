import type { InterestRow, MatchRow, CallProposalRow } from "@repo/database";

import { ageFromDateOfBirth, daysBetween } from "../../../lib/time";
import type { PageWithPhotos } from "../../biodata/lib/page-view";
import type { LetterState, LetterSummary } from "../../biodata/types";
import { firstLineOf } from "./note-rules";

export const PRIORITY_WINDOW_HOURS = 48;
const AUTO_CLOSE_DAYS = 30;

export function isPriorityActive(letter: InterestRow, now: Date) {
	return (
		letter.status === "pending" &&
		letter.isPriority &&
		letter.priorityUntil !== null &&
		letter.priorityUntil.getTime() > now.getTime()
	);
}

export function letterStateFor(
	letter: InterestRow,
	viewerUserId: string,
	match: MatchRow | null,
): LetterState {
	const received = letter.toUserId === viewerUserId;

	switch (letter.status) {
		case "pending":
			return received ? "waiting_for_you" : "waiting_for_them";
		case "accepted":
			if (!match) {
				return "introduced";
			}
			return match.stage === "closed" ? "introduction_closed" : match.stage;
		case "declined":
			return received ? "declined_by_you" : "declined_by_them";
		case "withdrawn":
			return received ? "withdrawn_by_them" : "withdrawn_by_you";
		case "closed": {
			const expired =
				letter.respondedAt === null &&
				letter.closedAt !== null &&
				daysBetween(letter.createdAt, letter.closedAt) >= AUTO_CLOSE_DAYS;
			return expired ? "expired" : "closed";
		}
	}
}

/** Whether an introduction waits on this person: seals to see, times to tick, or unread words. */
export function isYourMove(params: {
	match: MatchRow;
	viewerUserId: string;
	openProposal: CallProposalRow | null;
	unread: number;
}) {
	const { match, viewerUserId, openProposal } = params;
	if (match.stage === "closed") {
		return false;
	}
	const isA = match.userAId === viewerUserId;
	const sealsSeen = isA ? match.sealsSeenByAAt : match.sealsSeenByBAt;
	if (!sealsSeen) {
		return true;
	}
	if (params.unread > 0) {
		return true;
	}
	if (openProposal && openProposal.proposedByUserId !== viewerUserId) {
		const mine = isA ? openProposal.availabilityA : openProposal.availabilityB;
		if (mine.length === 0) {
			return true;
		}
	}
	return false;
}

export function toLetterSummary(params: {
	letter: InterestRow;
	viewerUserId: string;
	otherPage: PageWithPhotos | null;
	match: MatchRow | null;
	openProposal: CallProposalRow | null;
	bookedSlot: Date | null;
	unread: number;
	hasFamilyReaction: boolean;
	/** Family members see stage lines only: no note text and no safety flag. */
	stageLineOnly: boolean;
	now: Date;
}): LetterSummary {
	const { letter, viewerUserId, otherPage, match, now } = params;
	const direction = letter.fromUserId === viewerUserId ? "sent" : "received";
	const introduced = Boolean(match);

	const otherName =
		otherPage === null
			? ""
			: introduced && otherPage.fullName
				? otherPage.fullName
				: otherPage.displayName;

	const summary: LetterSummary = {
		letterId: letter.id,
		direction,
		otherHandle: otherPage?.handle ?? "",
		otherName,
		otherAge: otherPage?.dateOfBirth ? ageFromDateOfBirth(otherPage.dateOfBirth, now) : null,
		otherCity: otherPage?.location ?? null,
		state: letterStateFor(letter, viewerUserId, match),
		firstLine: params.stageLineOnly ? null : firstLineOf(letter.message),
		isPriority: isPriorityActive(letter, now),
		declineMode: letter.declineMode,
		hasFamilyReaction: params.hasFamilyReaction,
		createdAt: letter.createdAt.toISOString(),
		updatedAt: letter.updatedAt.toISOString(),
		introduction: match
			? {
					matchId: match.id,
					stage: match.stage,
					bookedSlot: params.bookedSlot?.toISOString() ?? null,
					yourMove: isYourMove({
						match,
						viewerUserId,
						openProposal: params.openProposal,
						unread: params.unread,
					}),
					unread: params.stageLineOnly ? 0 : params.unread,
					sealsSeen:
						(match.userAId === viewerUserId
							? match.sealsSeenByAAt
							: match.sealsSeenByBAt) !== null,
					lastMessageAt: params.stageLineOnly
						? null
						: (match.lastMessageAt?.toISOString() ?? null),
				}
			: null,
	};

	// The safety flag is shown to the recipient only; the sender is never told.
	if (!params.stageLineOnly && direction === "received" && letter.safetyFlag) {
		summary.safetyFlag = letter.safetyFlag;
	}

	return summary;
}
