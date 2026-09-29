import {
	callProposal,
	db,
	getMatchById,
	getProposalById,
	match as matchTable,
} from "@repo/database";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { formatCallTime } from "../../../lib/time";
import { protectedProcedure } from "../../../orpc/procedures";
import { CallProposalSchema } from "../../biodata/types";
import { notifyUser } from "../../notifications/lib/notify";
import { firstSharedSlot } from "../lib/slots";
import { assertParticipant, toCallProposalView } from "../lib/view";

export const setAvailability = protectedProcedure
	.route({
		method: "POST",
		path: "/matches/proposals/{proposalId}/availability",
		tags: ["Introductions"],
		summary: "Tick the evenings that work",
		description:
			"The lowest slot both people ticked is booked, and both get a calendar invite.",
	})
	.input(
		z.object({
			proposalId: z.string(),
			slotIndexes: z.array(z.number().int().min(0).max(2)).max(3),
		}),
	)
	.output(CallProposalSchema)
	.handler(async ({ input, context: { user } }) => {
		const proposal = await getProposalById(input.proposalId);
		// A missing proposal and one on someone else's introduction answer alike (quality rule S1).
		if (!proposal) {
			fail("NOT_FOUND", "MATCH_NOT_FOUND");
		}
		assertParticipant(proposal.match, user.id);
		const match = proposal.match;
		if (match.stage === "closed") {
			fail("CONFLICT", "MATCH_CLOSED");
		}
		if (proposal.status !== "open") {
			fail("CONFLICT", "PROPOSAL_NOT_OPEN");
		}
		if (proposal.proposedByUserId === user.id) {
			// A proposer's own three are assumed to work for them.
			fail("BAD_REQUEST", "PROPOSAL_NOT_OPEN");
		}

		const isA = match.userAId === user.id;
		const mine = Array.from(new Set(input.slotIndexes)).sort((a, b) => a - b);
		const theirs = isA ? proposal.availabilityB : proposal.availabilityA;
		const booked = firstSharedSlot(mine, theirs);
		const now = new Date();
		const bookedSlot = booked === null ? null : (proposal.slots[booked] ?? null);

		await db.transaction(async (tx) => {
			await tx
				.update(callProposal)
				.set({
					...(isA ? { availabilityA: mine } : { availabilityB: mine }),
					...(bookedSlot
						? { status: "booked" as const, bookedSlot, answeredAt: now }
						: {}),
				})
				.where(and(eq(callProposal.id, proposal.id), eq(callProposal.status, "open")));

			if (bookedSlot && match.stage === "introduced") {
				await tx
					.update(matchTable)
					.set({ stage: "call_booked" })
					.where(eq(matchTable.id, match.id));
			}
		});

		if (bookedSlot) {
			await Promise.all(
				[match.userAId, match.userBId].map((participant) =>
					notifyUser({
						userId: participant,
						copy: "CALL_BOOKED",
						link: `/letters/${match.interestId}`,
						values: {
							when: formatCallTime(
								bookedSlot,
								participant === match.userAId
									? proposal.timeZoneA
									: proposal.timeZoneB,
							),
						},
						email: true,
						data: {
							letterId: match.interestId,
							proposalId: proposal.id,
							bookedSlot: bookedSlot.toISOString(),
						},
					}),
				),
			);
		}

		const refreshed = await getMatchById(match.id);
		const updated = refreshed?.proposals.find((row) => row.id === proposal.id);
		if (!refreshed || !updated) {
			fail("NOT_FOUND", "PROPOSAL_NOT_FOUND");
		}
		return toCallProposalView(updated, refreshed, user.id);
	});
