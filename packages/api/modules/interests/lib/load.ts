import {
	countUnreadByMatch,
	getBlockedUserIdsEitherWay,
	getMarginNotes,
	getPagesByUserIds,
	getProposalsForMatches,
	type CallProposalRow,
	type InterestRow,
	type MatchRow,
} from "@repo/database";

import type { LetterSummary } from "../../biodata/types";
import { toLetterSummary } from "./summary";

export type LetterWithMatch = InterestRow & { match: MatchRow | null };

/**
 * Builds letter rows for one candidate in one household, batching the pages, proposals, unread
 * counts and pencil marks they need. Letters with blocked people are dropped (blocks hide
 * everything, both ways).
 */
export async function summarizeLetters(params: {
	letters: LetterWithMatch[];
	candidateUserId: string;
	organizationId: string;
	stageLineOnly?: boolean;
	now?: Date;
}): Promise<LetterSummary[]> {
	const now = params.now ?? new Date();
	const blocked = await getBlockedUserIdsEitherWay(params.candidateUserId);
	const letters = params.letters.filter((letter) => {
		const other =
			letter.fromUserId === params.candidateUserId ? letter.toUserId : letter.fromUserId;
		return !blocked.has(other);
	});
	if (letters.length === 0) {
		return [];
	}

	const otherIds = letters.map((letter) =>
		letter.fromUserId === params.candidateUserId ? letter.toUserId : letter.fromUserId,
	);
	const matches = letters
		.map((letter) => letter.match)
		.filter((match): match is MatchRow => Boolean(match));
	const matchIds = matches.map((match) => match.id);

	const [pages, proposals, unread] = await Promise.all([
		getPagesByUserIds(otherIds),
		getProposalsForMatches(matchIds),
		countUnreadByMatch(params.candidateUserId, matchIds),
	]);
	const pageByUser = new Map(pages.map((page) => [page.userId, page]));
	const notes = await getMarginNotes(
		params.organizationId,
		pages.map((page) => page.id),
	);
	// "A pencil mark if family reacted": the candidate's own notes are private notes to self
	// (spec.md §13), so they neither count here nor show through a stage line.
	const reactedProfiles = new Set(
		notes
			.filter(
				(note) => note.reaction !== null && note.authorUserId !== params.candidateUserId,
			)
			.map((note) => note.profileId),
	);

	const proposalsByMatch = new Map<string, CallProposalRow[]>();
	for (const proposal of proposals) {
		const list = proposalsByMatch.get(proposal.matchId) ?? [];
		list.push(proposal);
		proposalsByMatch.set(proposal.matchId, list);
	}

	return letters.map((letter) => {
		const otherUserId =
			letter.fromUserId === params.candidateUserId ? letter.toUserId : letter.fromUserId;
		const otherPage = pageByUser.get(otherUserId) ?? null;
		const matchProposals = letter.match ? (proposalsByMatch.get(letter.match.id) ?? []) : [];
		const openProposal = matchProposals.find((proposal) => proposal.status === "open") ?? null;
		const booked = matchProposals.find((proposal) => proposal.status === "booked") ?? null;

		return toLetterSummary({
			letter,
			viewerUserId: params.candidateUserId,
			otherPage,
			match: letter.match,
			openProposal,
			bookedSlot: booked?.bookedSlot ?? null,
			unread: letter.match ? (unread.get(letter.match.id) ?? 0) : 0,
			hasFamilyReaction: otherPage ? reactedProfiles.has(otherPage.id) : false,
			stageLineOnly: params.stageLineOnly ?? false,
			now,
		});
	});
}

export const LETTER_BOXES = ["waiting", "introductions", "sent", "closed"] as const;
export type LetterBox = (typeof LETTER_BOXES)[number];

/** Which box a letter sits in, from the candidate's side (design.md §5.4). */
export function boxFor(letter: LetterWithMatch, candidateUserId: string): LetterBox {
	if (letter.status === "pending") {
		return letter.toUserId === candidateUserId ? "waiting" : "sent";
	}
	if (letter.status === "accepted" && letter.match && letter.match.stage !== "closed") {
		return "introductions";
	}
	if (letter.status === "accepted" && !letter.match) {
		return "introductions";
	}
	return "closed";
}

/** Orders a box: waiting oldest first with live priority notes pinned; introductions by the next call. */
export function sortBox(box: LetterBox, summaries: LetterSummary[]) {
	const time = (value: string | null | undefined) => (value ? new Date(value).getTime() : 0);
	const sorted = [...summaries];
	switch (box) {
		case "waiting":
			return sorted.sort(
				(a, b) =>
					Number(b.isPriority) - Number(a.isPriority) ||
					time(a.createdAt) - time(b.createdAt),
			);
		case "introductions":
			return sorted.sort((a, b) => {
				const nextA = a.introduction?.bookedSlot
					? time(a.introduction.bookedSlot)
					: Number.POSITIVE_INFINITY;
				const nextB = b.introduction?.bookedSlot
					? time(b.introduction.bookedSlot)
					: Number.POSITIVE_INFINITY;
				if (nextA !== nextB) {
					return nextA - nextB;
				}
				return (
					time(b.introduction?.lastMessageAt ?? b.updatedAt) -
					time(a.introduction?.lastMessageAt ?? a.updatedAt)
				);
			});
		case "sent":
			return sorted.sort((a, b) => time(b.createdAt) - time(a.createdAt));
		case "closed":
			return sorted.sort((a, b) => time(b.updatedAt) - time(a.updatedAt));
	}
}
