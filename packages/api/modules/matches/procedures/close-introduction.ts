import {
	CLOSE_REASONS,
	db,
	getMatchById,
	getPagesByUserIds,
	match as matchTable,
} from "@repo/database";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { notifyUser } from "../../notifications/lib/notify";
import { assertParticipant } from "../lib/view";
import { IntroductionSummarySchema } from "../types";

export const closeIntroduction = protectedProcedure
	.route({
		method: "POST",
		path: "/matches/{matchId}/close",
		tags: ["Introductions"],
		summary: "Close kindly",
		description:
			"The other side sees the closing note. Messaging stops; the thread stays readable to both.",
	})
	.input(
		z.object({
			matchId: z.string(),
			closingNote: z.string().trim().min(20).max(400),
			reason: z.enum(CLOSE_REASONS),
		}),
	)
	.output(IntroductionSummarySchema)
	.handler(async ({ input, context: { user } }) => {
		const match = await getMatchById(input.matchId);
		assertParticipant(match, user.id);
		const now = new Date();

		const [closed] = await db
			.update(matchTable)
			.set({
				stage: "closed",
				closedAt: now,
				closedByUserId: user.id,
				closingNote: input.closingNote,
				closeReason: input.reason,
			})
			.where(and(eq(matchTable.id, match.id), ne(matchTable.stage, "closed")))
			.returning();
		if (!closed) {
			fail("CONFLICT", "MATCH_CLOSED");
		}

		const otherUserId = match.userAId === user.id ? match.userBId : match.userAId;
		await notifyUser({
			userId: otherUserId,
			copy: "INTRODUCTION_CLOSED",
			link: `/letters/${match.interestId}`,
			email: true,
			data: { letterId: match.interestId },
		});

		const [otherPage] = await getPagesByUserIds([otherUserId]);
		return {
			id: closed.id,
			letterId: closed.interestId,
			stage: closed.stage,
			otherHandle: otherPage?.handle ?? "",
			otherName: otherPage?.fullName ?? otherPage?.displayName ?? "",
			otherCity: otherPage?.location ?? null,
			bookedSlot: null,
			lastMessageAt: closed.lastMessageAt?.toISOString() ?? null,
			unread: 0,
			yourMove: false,
			sealsSeen: true,
			closedAt: now.toISOString(),
		};
	});
