import {
	closeExpiredLetters,
	getLetterById,
	getMarginNotes,
	getMatchById,
	getPageByUserId,
	isBlockedEitherWay,
	PAGE_AUTHORS,
	VERIFICATION_LEVELS,
} from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { firstNameOf, toPageView } from "../../biodata/lib/page-view";
import {
	FitReasonSchema,
	LetterSummarySchema,
	MarginNoteSchema,
	PageViewSchema,
	SafetyFlagSchema,
} from "../../biodata/types";
import { requireCandidate } from "../../households/lib/context";
import { marginReaderOf, toMarginNotes } from "../../margin/lib/format";
import { buildIntroductionView } from "../../matches/lib/view";
import { IntroductionViewSchema } from "../../matches/types";
import { reasonsForViewer } from "../../profiles/lib/viewer";
import { summarizeLetters } from "../lib/load";

export const getLetter = protectedProcedure
	.route({
		method: "GET",
		path: "/interests/{letterId}",
		tags: ["Letters"],
		summary: "Open a letter",
		description:
			"The note clipped to its page, the reader's own reasons (gaps included), pencil notes and, once accepted, the introduction. The same letter id serves the whole thread.",
	})
	.input(z.object({ letterId: z.string() }))
	.output(
		z.object({
			letter: LetterSummarySchema,
			direction: z.enum(["sent", "received"]),
			note: z.string().nullable(),
			declineNote: z.string().nullable(),
			signer: z.object({
				firstName: z.string(),
				/** The sender page's display name (public on its header): the seal's initials. */
				displayName: z.string(),
				pageCreatedBy: z.enum(PAGE_AUTHORS),
				verification: z.enum(VERIFICATION_LEVELS),
			}),
			otherPage: PageViewSchema,
			reasons: z.array(FitReasonSchema),
			safetyFlag: SafetyFlagSchema.nullable(),
			pencilNotes: z.array(MarginNoteSchema),
			introduction: IntroductionViewSchema.nullable(),
			canAnswer: z.boolean(),
			canWithdraw: z.boolean(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		let letter = await getLetterById(input.letterId);
		if (!letter || (letter.fromUserId !== user.id && letter.toUserId !== user.id)) {
			fail("NOT_FOUND", "LETTER_NOT_FOUND");
		}
		const direction = letter.fromUserId === user.id ? "sent" : "received";
		const organizationId =
			direction === "sent" ? letter.fromOrganizationId : letter.toOrganizationId;
		const context = await requireCandidate(organizationId, user.id);
		const otherUserId = direction === "sent" ? letter.toUserId : letter.fromUserId;

		if (await isBlockedEitherWay(user.id, otherUserId)) {
			fail("NOT_FOUND", "LETTER_NOT_FOUND");
		}

		// Unanswered letters close by themselves after 30 days, lazily on read.
		if (letter.status === "pending" && (await closeExpiredLetters(organizationId)) > 0) {
			letter = (await getLetterById(input.letterId)) ?? letter;
		}

		const otherPage = await getPageByUserId(otherUserId);
		if (!otherPage) {
			fail("NOT_FOUND", "PAGE_NOT_FOUND");
		}
		const senderPage = direction === "sent" ? context.page : otherPage;
		const matchRow = letter.match ? await getMatchById(letter.match.id) : null;

		const [summaries, view, reasons, notes, introduction] = await Promise.all([
			summarizeLetters({ letters: [letter], candidateUserId: user.id, organizationId }),
			toPageView(
				otherPage,
				matchRow ? "introduced" : direction === "received" ? "wrote_to_me" : "i_wrote",
				{
					phoneShared: matchRow
						? matchRow.userAId === otherUserId
							? matchRow.phoneSharedByA
							: matchRow.phoneSharedByB
						: false,
				},
			),
			reasonsForViewer(context, otherPage),
			getMarginNotes(organizationId, [otherPage.id]),
			matchRow ? buildIntroductionView(matchRow, user.id) : Promise.resolve(null),
		]);
		const summary = summaries[0];
		if (!summary) {
			fail("NOT_FOUND", "LETTER_NOT_FOUND");
		}

		return {
			letter: summary,
			direction,
			note: letter.message,
			declineNote: letter.status === "declined" ? letter.declineNote : null,
			signer: {
				firstName: firstNameOf(senderPage.displayName),
				displayName: senderPage.displayName,
				pageCreatedBy: senderPage.createdBy,
				verification: senderPage.verification,
			},
			otherPage: view,
			reasons,
			// Shown to the recipient only; the sender is never told.
			safetyFlag: direction === "received" ? letter.safetyFlag : null,
			pencilNotes: toMarginNotes(notes, marginReaderOf(context)),
			introduction,
			canAnswer: direction === "received" && letter.status === "pending",
			canWithdraw: direction === "sent" && letter.status === "pending",
		};
	});
