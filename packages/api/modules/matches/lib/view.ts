import {
	db,
	getPageByUserId,
	user as userTable,
	type CallProposalRow,
	type MatchRow,
} from "@repo/database";
import { eq } from "drizzle-orm";

import { fail } from "../../../lib/errors";
import { DAY_MS } from "../../../lib/time";
import { firstNameOf, toPageView } from "../../biodata/lib/page-view";
import type { CallProposalView } from "../../biodata/types";
import type { IntroductionView } from "../types";

export const QUIET_NUDGE_DAYS = 7;

export function isParticipant(match: MatchRow, userId: string) {
	return match.userAId === userId || match.userBId === userId;
}

export function assertParticipant(
	match: MatchRow | null | undefined,
	userId: string,
): asserts match is MatchRow {
	if (!match || !isParticipant(match, userId)) {
		fail("NOT_FOUND", "MATCH_NOT_FOUND");
	}
}

export function toCallProposalView(
	proposal: CallProposalRow,
	match: MatchRow,
	viewerUserId: string,
): CallProposalView {
	const isA = match.userAId === viewerUserId;
	return {
		id: proposal.id,
		proposedBy:
			proposal.proposedByUserId === null
				? "rishta"
				: proposal.proposedByUserId === viewerUserId
					? "you"
					: "them",
		slots: proposal.slots.map((slot) => slot.toISOString()),
		timeZoneYou: isA ? proposal.timeZoneA : proposal.timeZoneB,
		timeZoneThem: isA ? proposal.timeZoneB : proposal.timeZoneA,
		availabilityYou: isA ? proposal.availabilityA : proposal.availabilityB,
		availabilityThem: isA ? proposal.availabilityB : proposal.availabilityA,
		status: proposal.status,
		bookedSlot: proposal.bookedSlot?.toISOString() ?? null,
		note: proposal.note,
		createdAt: proposal.createdAt.toISOString(),
	};
}

/**
 * An introduction from one participant's side: both sealed sections open to each other, contact
 * as each side chose to share, the proposed evenings and the stage.
 */
export async function buildIntroductionView(
	match: MatchRow & { proposals: CallProposalRow[] },
	viewerUserId: string,
	now = new Date(),
): Promise<IntroductionView> {
	const isA = match.userAId === viewerUserId;
	const otherUserId = isA ? match.userBId : match.userAId;

	const [myPage, otherPage, otherUser] = await Promise.all([
		getPageByUserId(viewerUserId),
		getPageByUserId(otherUserId),
		db.query.user.findFirst({ where: eq(userTable.id, otherUserId), columns: { email: true } }),
	]);
	if (!otherPage || !myPage) {
		fail("NOT_FOUND", "MATCH_NOT_FOUND");
	}

	const myPhoneShared = isA ? match.phoneSharedByA : match.phoneSharedByB;
	const theirPhoneShared = isA ? match.phoneSharedByB : match.phoneSharedByA;
	const myFamilyShared = isA ? match.familySharedByA : match.familySharedByB;
	const theirFamilyShared = isA ? match.familySharedByB : match.familySharedByA;
	const familyVisible = myFamilyShared && theirFamilyShared;
	const lastActivity = match.lastMessageAt ?? match.createdAt;

	return {
		id: match.id,
		letterId: match.interestId,
		stage: match.stage,
		sealsBrokeAt: match.createdAt.toISOString(),
		sealsSeenAt: (isA ? match.sealsSeenByAAt : match.sealsSeenByBAt)?.toISOString() ?? null,
		you: {
			firstName: firstNameOf(myPage.displayName),
			timeZone: myPage.timeZone,
			city: myPage.location,
			phoneShared: myPhoneShared,
			familyShared: myFamilyShared,
		},
		them: {
			page: await toPageView(otherPage, "introduced", { phoneShared: theirPhoneShared, now }),
			firstName: firstNameOf(otherPage.displayName),
			timeZone: otherPage.timeZone,
			phoneShared: theirPhoneShared,
			familyShared: theirFamilyShared,
			contact: {
				email: otherUser?.email ?? null,
				phone: theirPhoneShared ? otherPage.contactPhone : null,
				family:
					familyVisible && otherPage.familyContactName && otherPage.familyContactPhone
						? { name: otherPage.familyContactName, phone: otherPage.familyContactPhone }
						: null,
			},
		},
		proposals: match.proposals.map((proposal) =>
			toCallProposalView(proposal, match, viewerUserId),
		),
		lastMessageAt: match.lastMessageAt?.toISOString() ?? null,
		quietNudge:
			match.stage === "introduced" &&
			now.getTime() - lastActivity.getTime() >= QUIET_NUDGE_DAYS * DAY_MS,
		closed:
			match.stage === "closed" && match.closedAt
				? {
						at: match.closedAt.toISOString(),
						byYou: match.closedByUserId === viewerUserId,
						note: match.closingNote,
						reason: match.closeReason,
					}
				: null,
	};
}
