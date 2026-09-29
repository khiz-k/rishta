import { getPreferenceByOrganizationId } from "@repo/database";
import { z } from "zod";

import { getServerCopy } from "../../../lib/copy";
import { fail } from "../../../lib/errors";
import { consumeRateLimit } from "../../../lib/rate-limit";
import { DAY_MS, toLocalDateString } from "../../../lib/time";
import { protectedProcedure } from "../../../orpc/procedures";
import { assertCanEditPage, getHouseholdContext, requirePage } from "../../households/lib/context";
import { aiDraft, DRAFT_SECTIONS, templateDraft } from "../lib/draft";

/** "Help me write" is capped at 10 drafts per household per day. */
const DRAFTS_PER_DAY = 10;

export const draftBiodata = protectedProcedure
	.route({
		method: "POST",
		path: "/ai/draft-biodata",
		tags: ["AI"],
		summary: "Help me write: a draft of About me, About my family, Looking for",
		description:
			"A visible, editable draft only; never saved on its own. Without an AI key it returns a plain draft built from your own answers (source: template).",
	})
	.input(
		z.object({
			organizationId: z.string(),
			tone: z.enum(["warm", "simple", "formal"]),
			answers: z.object({
				family: z.string().trim().max(280),
				everyday: z.string().trim().max(280),
				hopes: z.string().trim().max(280),
			}),
			sections: z.array(z.enum(DRAFT_SECTIONS)).min(1).max(3),
		}),
	)
	.output(
		z.object({
			aboutMe: z.string().optional(),
			aboutFamily: z.string().optional(),
			lookingFor: z.string().optional(),
			omittedPhrases: z.array(z.string()),
			source: z.enum(["ai", "template"]),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		assertCanEditPage(context);
		const page = requirePage(context);

		const day = toLocalDateString(new Date(), page.timeZone);
		if (!consumeRateLimit(`ai-draft:${input.organizationId}:${day}`, DRAFTS_PER_DAY, DAY_MS)) {
			fail("TOO_MANY_REQUESTS", "RATE_LIMITED");
		}

		const preference = (await getPreferenceByOrganizationId(input.organizationId)) ?? null;
		const sections = Array.from(new Set(input.sections));

		const drafted = await aiDraft({
			page,
			preference,
			answers: input.answers,
			tone: input.tone,
			sections,
		});
		if (drafted) {
			return drafted;
		}

		const t = await getServerCopy(user.locale);
		return templateDraft({ t, page, preference, answers: input.answers, sections });
	});
