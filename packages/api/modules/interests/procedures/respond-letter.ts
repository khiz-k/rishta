import {
	callProposal,
	closeExpiredLetters,
	db,
	DECLINE_MODES,
	getLetterById,
	getPageByUserId,
	interest,
	isBlockedEitherWay,
	LETTER_AUTO_CLOSE_DAYS,
	match,
	toPairKey,
} from "@repo/database";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getServerCopy } from "../../../lib/copy";
import { fail } from "../../../lib/errors";
import { DAY_MS } from "../../../lib/time";
import { protectedProcedure } from "../../../orpc/procedures";
import { LetterSummarySchema } from "../../biodata/types";
import { requireCandidate } from "../../households/lib/context";
import { proposeEvenings } from "../../matches/lib/slots";
import { notifyUser } from "../../notifications/lib/notify";
import { summarizeLetters } from "../lib/load";

export const respondLetter = protectedProcedure
	.route({
		method: "POST",
		path: "/interests/{letterId}/respond",
		tags: ["Letters"],
		summary: "Say yes, decline kindly, or let it close quietly",
		description:
			"Only the recipient candidate. A yes creates the introduction and its three proposed evenings in the same transaction; both seals break together.",
	})
	.input(
		z
			.object({
				letterId: z.string(),
				action: z.enum(["accept", "decline"]),
				declineMode: z.enum(DECLINE_MODES).optional(),
				declineNote: z.string().trim().max(400).optional(),
			})
			.refine((value) => value.action === "accept" || value.declineMode !== undefined, {
				message: "Choose a kind note or to let it close quietly",
				path: ["declineMode"],
			}),
	)
	.output(
		z.object({ letter: LetterSummarySchema, match: z.object({ id: z.string() }).nullable() }),
	)
	.handler(async ({ input, context: { user } }) => {
		const letter = await getLetterById(input.letterId);
		if (!letter || letter.toUserId !== user.id) {
			fail("NOT_FOUND", "LETTER_NOT_FOUND");
		}
		const context = await requireCandidate(letter.toOrganizationId, user.id);
		const now = new Date();

		if (letter.status === "withdrawn") {
			// "Arjun took back his note before you answered." No match is created.
			fail("CONFLICT", "LETTER_WITHDRAWN");
		}
		if (
			letter.status === "pending" &&
			now.getTime() - letter.createdAt.getTime() > LETTER_AUTO_CLOSE_DAYS * DAY_MS
		) {
			await closeExpiredLetters(letter.toOrganizationId, now);
			fail("CONFLICT", "LETTER_CLOSED");
		}
		if (letter.status !== "pending") {
			fail("CONFLICT", "LETTER_NOT_PENDING");
		}
		if (await isBlockedEitherWay(user.id, letter.fromUserId)) {
			fail("NOT_FOUND", "LETTER_NOT_FOUND");
		}

		let matchId: string | null = null;

		if (input.action === "accept") {
			const senderPage = await getPageByUserId(letter.fromUserId);
			if (!senderPage || senderPage.status === "closed") {
				fail("CONFLICT", "PAGE_UNAVAILABLE");
			}
			const slots = proposeEvenings({
				now,
				timeZoneA: senderPage.timeZone,
				timeZoneB: context.page.timeZone,
			});

			matchId = await db.transaction(async (tx) => {
				const [accepted] = await tx
					.update(interest)
					.set({ status: "accepted", respondedAt: now })
					.where(and(eq(interest.id, letter.id), eq(interest.status, "pending")))
					.returning({ id: interest.id });
				if (!accepted) {
					fail("CONFLICT", "LETTER_NOT_PENDING");
				}

				// A single accepted letter is an introduction (this fixes the old core-loop bug).
				const [created] = await tx
					.insert(match)
					.values({
						interestId: letter.id,
						pairKey: toPairKey(letter.fromUserId, letter.toUserId),
						userAId: letter.fromUserId,
						organizationAId: letter.fromOrganizationId,
						userBId: letter.toUserId,
						organizationBId: letter.toOrganizationId,
						stage: "introduced",
						// The break plays at once on the acceptor's screen.
						sealsSeenByBAt: now,
					})
					.onConflictDoNothing()
					.returning({ id: match.id });
				if (!created) {
					fail("CONFLICT", "LETTER_EXISTS");
				}

				await tx.insert(callProposal).values({
					matchId: created.id,
					proposedByUserId: null,
					slots,
					timeZoneA: senderPage.timeZone,
					timeZoneB: context.page.timeZone,
				});

				return created.id;
			});

			await notifyUser({
				userId: letter.fromUserId,
				copy: "LETTER_ANSWERED_YES",
				link: `/letters/${letter.id}`,
				email: true,
				data: { letterId: letter.id },
			});
		} else {
			const t = await getServerCopy(user.locale);
			const kind = input.declineMode === "kind_note";
			const [declined] = await db
				.update(interest)
				.set({
					status: "declined",
					declineMode: input.declineMode ?? "quiet",
					declineNote: kind ? input.declineNote || t("defaults.declineNote") : null,
					respondedAt: now,
					closedAt: now,
				})
				.where(and(eq(interest.id, letter.id), eq(interest.status, "pending")))
				.returning({ id: interest.id });
			if (!declined) {
				fail("CONFLICT", "LETTER_NOT_PENDING");
			}

			// Declines never email by default: no painful emails at 11 p.m.
			await notifyUser({
				userId: letter.fromUserId,
				copy: "LETTER_ANSWERED",
				link: `/letters/${letter.id}`,
				email: false,
				data: { letterId: letter.id },
			});
		}

		const refreshed = await getLetterById(letter.id);
		const [summary] = refreshed
			? await summarizeLetters({
					letters: [refreshed],
					candidateUserId: user.id,
					organizationId: letter.toOrganizationId,
				})
			: [];
		if (!summary) {
			fail("NOT_FOUND", "LETTER_NOT_FOUND");
		}

		return { letter: summary, match: matchId ? { id: matchId } : null };
	});
