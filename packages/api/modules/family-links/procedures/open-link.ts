import {
	FAMILY_REACTIONS,
	getLetterById,
	getLinkReaction,
	getPageByUserId,
	PAGE_LANGUAGES,
	recordFamilyLinkOpen,
} from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { consumeRateLimit, getClientIp } from "../../../lib/rate-limit";
import { publicProcedure } from "../../../orpc/procedures";
import { translateNote, translatePageView } from "../../ai/lib/translate";
import { firstNameOf, toPageView } from "../../biodata/lib/page-view";
import { PageViewSchema } from "../../biodata/types";
import { resolveFamilyLink } from "../lib/open-link";

export const openFamilyLink = publicProcedure
	.route({
		method: "GET",
		path: "/family-links/open/{token}",
		tags: ["Family links"],
		summary: "Open a family link (no account)",
		description:
			"The stranger view of the page in the link's language (or the one the reader picked from the language row), labelled as translated, with the watermark. Rate-limited.",
	})
	.input(
		z.object({
			token: z.string().min(1).max(200),
			// The language row (design.md §5.9): Ammi can re-set the page in her own script if the
			// sharer picked the wrong one. Translations are cached per page version and language.
			language: z.enum(PAGE_LANGUAGES).optional(),
		}),
	)
	.output(
		z.discriminatedUnion("state", [
			z.object({
				state: z.literal("open"),
				page: PageViewSchema,
				translated: z.boolean(),
				original: PageViewSchema.nullable(),
				language: z.enum(PAGE_LANGUAGES),
				watermark: z.object({
					recipientLabel: z.string(),
					sharedBy: z.string(),
					until: z.string(),
				}),
				note: z
					.object({ text: z.string(), translated: z.boolean(), signer: z.string() })
					.nullable(),
				myReaction: z
					.object({
						reaction: z.enum(FAMILY_REACTIONS).nullable(),
						text: z.string().nullable(),
					})
					.nullable(),
			}),
			// "This link has closed. Ask Priya to send it again." Revocation is never revealed.
			z.object({ state: z.literal("closed"), sharedBy: z.string().nullable() }),
		]),
	)
	.handler(async ({ input, context: { headers } }) => {
		if (
			!consumeRateLimit(`family-link-open:ip:${getClientIp(headers)}`, 60, 60_000) ||
			!consumeRateLimit(`family-link-open:token:${input.token.slice(0, 16)}`, 30, 60_000)
		) {
			fail("TOO_MANY_REQUESTS", "RATE_LIMITED");
		}

		const resolved = await resolveFamilyLink(input.token);
		if (resolved.state === "closed") {
			return resolved;
		}
		const { link, page, sharedBy } = resolved;
		const language = input.language ?? link.language;
		await recordFamilyLinkOpen(link.id);

		// Photos on a family link are always veiled; the sealed section stays closed.
		const original = await toPageView(page, "family_link");
		const translatedView = await translatePageView({
			page,
			view: original,
			language,
		});

		let note: { text: string; translated: boolean; signer: string } | null = null;
		if (link.letterId) {
			const letter = await getLetterById(link.letterId);
			if (letter?.message && letter.status !== "withdrawn") {
				const senderPage = await getPageByUserId(letter.fromUserId);
				const translatedNote =
					language !== page.pageLanguage
						? await translateNote({
								letterId: letter.id,
								note: letter.message,
								language,
							})
						: null;
				note = {
					text: translatedNote ?? letter.message,
					translated: translatedNote !== null,
					signer: firstNameOf(senderPage?.displayName ?? ""),
				};
			}
		}

		const reaction = await getLinkReaction(link.id, page.id);

		return {
			state: "open" as const,
			page: translatedView ?? original,
			translated: translatedView !== null,
			original: translatedView ? original : null,
			language,
			watermark: {
				recipientLabel: link.recipientLabel,
				sharedBy,
				until: link.expiresAt.toISOString(),
			},
			note,
			myReaction: reaction ? { reaction: reaction.reaction, text: reaction.text } : null,
		};
	});
