import { auth } from "@repo/auth";
import { getProposalById, isBlockedEitherWay } from "@repo/database";
import { getBaseUrl } from "@repo/utils";

import { getServerCopy } from "../../../lib/copy";
import { formatCallTime } from "../../../lib/time";
import { buildCallInvite } from "./ics";
import { isParticipant } from "./view";

const NOT_FOUND = () => new Response(null, { status: 404 });

/**
 * `GET /api/calls/:proposalId/ics` (spec.md F9): the booked first call as a calendar file,
 * with both local times written out. Only the two people in the Introduction can fetch it;
 * anyone else, a closed Introduction or a block gets the same 404 as a missing proposal.
 */
export async function callInviteResponse(request: Request, proposalId: string) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return new Response(null, { status: 401 });
	}
	const viewerId = session.user.id;

	const proposal = await getProposalById(proposalId);
	const bookedSlot = proposal?.bookedSlot;
	if (
		!proposal ||
		!bookedSlot ||
		proposal.status !== "booked" ||
		!isParticipant(proposal.match, viewerId) ||
		proposal.match.stage === "closed"
	) {
		return NOT_FOUND();
	}

	const match = proposal.match;
	const isA = match.userAId === viewerId;
	if (await isBlockedEitherWay(viewerId, isA ? match.userBId : match.userAId)) {
		return NOT_FOUND();
	}

	const locale = session.user.locale;
	const t = await getServerCopy(locale);
	const formatLocale = locale && locale !== "en" ? locale : "en-GB";
	const zones = isA
		? [proposal.timeZoneA, proposal.timeZoneB]
		: [proposal.timeZoneB, proposal.timeZoneA];
	const times = Array.from(new Set(zones)).map(
		(zone) => `${formatCallTime(bookedSlot, zone, formatLocale)} (${zone.replace(/_/g, " ")})`,
	);

	const body = buildCallInvite({
		uid: proposal.id,
		start: bookedSlot,
		summary: t("call.summary"),
		description: [t("call.description"), ...times].join("\n"),
		url: `${getBaseUrl(process.env.NEXT_PUBLIC_SAAS_URL, 3000)}/letters/${match.interestId}`,
	});

	return new Response(body, {
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Content-Disposition": 'attachment; filename="rishta-first-call.ics"',
			"Cache-Control": "private, no-store",
		},
	});
}
