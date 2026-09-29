import { createNoteSuggestion, FIT_KEYS, getPreferenceByOrganizationId } from "@repo/database";
import { z } from "zod";

import { getServerCopy } from "../../../lib/copy";
import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { firstNameOf } from "../../biodata/lib/page-view";
import { evaluateFit } from "../../folio/lib/fit";
import { requireCandidate } from "../../households/lib/context";
import { loadPageForViewer } from "../../profiles/lib/viewer";
import { aiFirstLine, collectOverlaps, templateFirstLine } from "../lib/first-line";

export const suggestFirstLine = protectedProcedure
	.route({
		method: "POST",
		path: "/ai/suggest-first-line",
		tags: ["AI"],
		summary: "A first line for the note, from real overlaps",
		description:
			"Always returns: an AI line when configured, otherwise an i18n template. The line is stored and a note containing it verbatim is refused.",
	})
	.input(z.object({ organizationId: z.string(), toHandle: z.string().min(4).max(12) }))
	.output(
		z.object({
			suggestionId: z.string(),
			line: z.string(),
			basedOn: z.array(z.enum(FIT_KEYS)),
			source: z.enum(["ai", "template"]),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const context = await requireCandidate(input.organizationId, user.id);
		const { page: target } = await loadPageForViewer(context, input.toHandle);
		if (target.organizationId === input.organizationId) {
			fail("BAD_REQUEST", "PAGE_UNAVAILABLE");
		}

		const [myPreference, theirPreference] = await Promise.all([
			getPreferenceByOrganizationId(input.organizationId),
			getPreferenceByOrganizationId(target.organizationId),
		]);
		const reasons = myPreference
			? evaluateFit(
					{ page: context.page, preference: myPreference },
					{ page: target, preference: theirPreference ?? null },
				)
			: [];
		const overlaps = collectOverlaps({
			reasons,
			writerNativePlace: context.page.nativePlace,
			targetNativePlace: target.nativePlace,
		});

		const ai = await aiFirstLine({
			writerFirstName: firstNameOf(context.page.displayName),
			readerFirstName: firstNameOf(target.displayName),
			overlaps,
		});
		const t = await getServerCopy(user.locale);
		const chosen = ai
			? { line: ai.line, basedOn: ai.basedOn, source: "ai" as const }
			: { ...templateFirstLine(t, overlaps), source: "template" as const };

		const stored = await createNoteSuggestion({
			organizationId: input.organizationId,
			toProfileId: target.id,
			line: chosen.line,
			basedOn: chosen.basedOn,
			source: chosen.source,
		});
		if (!stored) {
			fail("INTERNAL_SERVER_ERROR", "PAGE_UNAVAILABLE");
		}

		return {
			suggestionId: stored.id,
			line: chosen.line,
			basedOn: chosen.basedOn,
			source: chosen.source,
		};
	});
