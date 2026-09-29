import { callProposal, db, getMatchById, getPageByUserId } from "@repo/database";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { CallProposalSchema } from "../../biodata/types";
import { notifyUser } from "../../notifications/lib/notify";
import { validateProposedSlots } from "../lib/slots";
import { assertParticipant, toCallProposalView } from "../lib/view";

export const proposeCall = protectedProcedure
	.route({
		method: "POST",
		path: "/matches/{matchId}/proposals",
		tags: ["Introductions"],
		summary: "Propose three other times",
		description:
			"Supersedes any open proposal. The proposer is assumed available; the other person picks one.",
	})
	.input(
		z.object({
			matchId: z.string(),
			slots: z.tuple([z.iso.datetime(), z.iso.datetime(), z.iso.datetime()]),
			note: z.string().trim().max(200).optional(),
		}),
	)
	.output(CallProposalSchema)
	.handler(async ({ input, context: { user } }) => {
		const match = await getMatchById(input.matchId);
		assertParticipant(match, user.id);
		if (match.stage === "closed") {
			fail("CONFLICT", "MATCH_CLOSED");
		}

		const now = new Date();
		const slots = input.slots.map((slot) => new Date(slot));
		const invalid = validateProposedSlots(slots, now);
		if (invalid) {
			fail("BAD_REQUEST", "INVALID_SLOTS", { reason: invalid });
		}

		const [pageA, pageB] = await Promise.all([
			getPageByUserId(match.userAId),
			getPageByUserId(match.userBId),
		]);
		const isA = match.userAId === user.id;

		const created = await db.transaction(async (tx) => {
			await tx
				.update(callProposal)
				.set({ status: "superseded", answeredAt: now })
				.where(and(eq(callProposal.matchId, match.id), eq(callProposal.status, "open")));

			const [row] = await tx
				.insert(callProposal)
				.values({
					matchId: match.id,
					proposedByUserId: user.id,
					slots,
					timeZoneA: pageA?.timeZone ?? "America/New_York",
					timeZoneB: pageB?.timeZone ?? "America/New_York",
					availabilityA: isA ? [0, 1, 2] : [],
					availabilityB: isA ? [] : [0, 1, 2],
					note: input.note ?? null,
				})
				.returning();
			return row;
		});
		if (!created) {
			fail("INTERNAL_SERVER_ERROR", "PROPOSAL_NOT_FOUND");
		}

		await notifyUser({
			userId: isA ? match.userBId : match.userAId,
			copy: "CALL_PROPOSED",
			link: `/letters/${match.interestId}`,
			email: true,
			data: { letterId: match.interestId, proposalId: created.id },
		});

		return toCallProposalView(created, match, user.id);
	});
