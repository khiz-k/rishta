import {
	countLettersSentSince,
	db,
	ensureHouseholdWallet,
	folioPage,
	getLettersBetweenUsers,
	getPageByHandle,
	getPreferenceByOrganizationId,
	getSuggestionLines,
	interest,
	isBlockedEitherWay,
	normalizeHandle,
	spendHouseholdCredits,
} from "@repo/database";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { startOfLocalDay } from "../../../lib/time";
import { protectedProcedure } from "../../../orpc/procedures";
import { screenText } from "../../ai/lib/safety";
import { passesDealbreakers } from "../../folio/lib/fit";
import { requireCandidate } from "../../households/lib/context";
import { getEntitlements } from "../../households/lib/entitlements";
import { notifyUser } from "../../notifications/lib/notify";
import {
	containsSuggestionVerbatim,
	findContactDetails,
	NOTE_MAX_LENGTH,
	NOTE_MIN_LENGTH,
} from "../lib/note-rules";
import { PRIORITY_WINDOW_HOURS } from "../lib/summary";

/**
 * A double press within this window returns the note already sealed. With the unique
 * (from, to) pair this makes `idempotencyKey` retries safe without storing the key.
 */
const REPLAY_WINDOW_MS = 10 * 60 * 1000;

export const sendLetter = protectedProcedure
	.route({
		method: "POST",
		path: "/interests",
		tags: ["Letters"],
		summary: "Seal and send a note",
		description:
			"Only the candidate, on an active page. 40-400 characters, no contact details, no unedited suggestion. Credits, the letter and the ledger are written in one transaction.",
	})
	.input(
		z.object({
			organizationId: z.string(),
			toHandle: z.string().min(4).max(12),
			note: z.string().trim().min(NOTE_MIN_LENGTH).max(NOTE_MAX_LENGTH),
			suggestionId: z.string().optional(),
			priority: z.boolean().default(false),
			useCredit: z.boolean().optional(),
			idempotencyKey: z.string().min(8).max(100),
		}),
	)
	.output(
		z.object({
			letterId: z.string(),
			sealedAt: z.string(),
			notesLeftToday: z.number().int(),
			credits: z.number().int(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const context = await requireCandidate(input.organizationId, user.id);
		const myPage = context.page;
		if (myPage.status !== "active") {
			fail("PRECONDITION_FAILED", "PAGE_NOT_ACTIVE");
		}

		const target = await getPageByHandle(normalizeHandle(input.toHandle));
		if (!target?.userId || target.organizationId === input.organizationId) {
			fail("NOT_FOUND", "PAGE_NOT_FOUND");
		}
		if (await isBlockedEitherWay(user.id, target.userId)) {
			fail("NOT_FOUND", "PAGE_NOT_FOUND");
		}
		if (target.status !== "active") {
			fail("CONFLICT", "PAGE_UNAVAILABLE");
		}
		const recipientUserId = target.userId;

		const entitlements = await getEntitlements(input.organizationId);
		const now = new Date();
		const dayStart = startOfLocalDay(now, myPage.timeZone);
		const walletRow = await ensureHouseholdWallet(input.organizationId, { userId: user.id });

		const letters = await getLettersBetweenUsers(user.id, target.userId);
		const mine = letters.find((letter) => letter.fromUserId === user.id);
		const theirs = letters.find((letter) => letter.fromUserId === target.userId);

		if (mine) {
			if (
				mine.status === "pending" &&
				now.getTime() - mine.createdAt.getTime() < REPLAY_WINDOW_MS
			) {
				const sentToday = await countLettersSentSince(input.organizationId, dayStart);
				return {
					letterId: mine.id,
					sealedAt: mine.createdAt.toISOString(),
					notesLeftToday: Math.max(0, entitlements.notesPerDay - sentToday),
					credits: walletRow.credits,
				};
			}
			fail("CONFLICT", "ALREADY_WROTE", { letterId: mine.id });
		}
		if (theirs) {
			// "Arjun has already written to you. Read his letter." (the UI opens it).
			if (theirs.status === "pending") {
				fail("CONFLICT", "ALREADY_WROTE_TO_YOU", { letterId: theirs.id });
			}
			fail("CONFLICT", "LETTER_EXISTS", { letterId: theirs.id });
		}

		const note = input.note;
		if (findContactDetails(note)) {
			fail("BAD_REQUEST", "CONTACT_IN_NOTE");
		}
		const suggestions = await getSuggestionLines(input.organizationId, target.id);
		if (
			containsSuggestionVerbatim(
				note,
				suggestions.map((suggestion) => suggestion.line),
			)
		) {
			fail("BAD_REQUEST", "SUGGESTION_UNEDITED");
		}

		// Recipients are never written to by people their own dealbreakers exclude.
		const [myPreference, theirPreference] = await Promise.all([
			getPreferenceByOrganizationId(input.organizationId),
			getPreferenceByOrganizationId(target.organizationId),
		]);
		if (
			theirPreference &&
			!passesDealbreakers(
				{ page: target, preference: theirPreference },
				{ page: myPage, preference: myPreference ?? null },
				now,
			)
		) {
			fail("FORBIDDEN", "NOT_A_FIT");
		}

		// Daily limit per household-local day; over it, one credit buys one extra note.
		const sentToday = await countLettersSentSince(input.organizationId, dayStart);
		const overLimit = sentToday >= entitlements.notesPerDay;
		if (overLimit && !input.useCredit) {
			fail("PRECONDITION_FAILED", "DAILY_LIMIT", { limit: entitlements.notesPerDay });
		}
		const spend: Array<{ reason: "extra_note" | "priority_note"; delta: number }> = [];
		if (overLimit) {
			spend.push({ reason: "extra_note", delta: 1 });
		}
		if (input.priority) {
			spend.push({ reason: "priority_note", delta: 1 });
		}
		const cost = spend.reduce((sum, entry) => sum + entry.delta, 0);
		if (walletRow.credits < cost) {
			fail("PRECONDITION_FAILED", "NOT_ENOUGH_CREDITS");
		}

		// Rules first, AI second; a flag never blocks sending (only contact details do).
		const safetyFlag = await screenText(note, { kind: "note" });
		const validSuggestionId = suggestions.some(
			(suggestion) => suggestion.id === input.suggestionId,
		)
			? (input.suggestionId ?? null)
			: null;

		const { letter, credits } = await db.transaction(async (tx) => {
			const [created] = await tx
				.insert(interest)
				.values({
					fromUserId: user.id,
					toUserId: recipientUserId,
					fromOrganizationId: input.organizationId,
					toOrganizationId: target.organizationId,
					status: "pending",
					message: note,
					isPriority: input.priority,
					priorityUntil: input.priority
						? new Date(now.getTime() + PRIORITY_WINDOW_HOURS * 60 * 60 * 1000)
						: null,
					creditsSpent: cost,
					suggestionId: validSuggestionId,
					safetyFlag,
				})
				.onConflictDoNothing()
				.returning();

			if (!created) {
				fail("CONFLICT", "ALREADY_WROTE");
			}

			let balance = walletRow.credits;
			if (cost > 0) {
				const spent = await spendHouseholdCredits(tx, {
					organizationId: input.organizationId,
					entries: spend,
					interestId: created.id,
					userId: user.id,
				});
				if (spent === null) {
					fail("PRECONDITION_FAILED", "NOT_ENOUGH_CREDITS");
				}
				balance = spent;
			}

			// The page shows the pressed seal in this household's folios.
			await tx
				.update(folioPage)
				.set({ state: "noted", answeredAt: now })
				.where(
					and(
						eq(folioPage.organizationId, input.organizationId),
						eq(folioPage.profileId, target.id),
						ne(folioPage.state, "passed"),
					),
				);

			return { letter: created, credits: balance };
		});

		await notifyUser({
			userId: recipientUserId,
			copy: "LETTER_RECEIVED",
			link: `/letters/${letter.id}`,
			email: true,
			data: { letterId: letter.id },
		});

		return {
			letterId: letter.id,
			sealedAt: letter.createdAt.toISOString(),
			notesLeftToday: Math.max(0, entitlements.notesPerDay - (sentToday + 1)),
			credits,
		};
	});
