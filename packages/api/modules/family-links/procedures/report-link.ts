import { createReport, getFamilyLinkByTokenHash, REPORT_CATEGORIES } from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { consumeRateLimit, getClientIp } from "../../../lib/rate-limit";
import { publicProcedure } from "../../../orpc/procedures";
import { OkSchema } from "../../biodata/types";
import { hashFamilyLinkToken } from "../lib/token";

export const reportFamilyLink = publicProcedure
	.route({
		method: "POST",
		path: "/family-links/report",
		tags: ["Family links"],
		summary: "Report a page from a family link (no account)",
	})
	.input(
		z.object({
			token: z.string().min(1).max(200),
			category: z.enum(REPORT_CATEGORIES),
			details: z.string().trim().max(2000).optional(),
		}),
	)
	.output(OkSchema)
	.handler(async ({ input, context: { headers } }) => {
		if (!consumeRateLimit(`family-link-report:ip:${getClientIp(headers)}`, 5, 60 * 60_000)) {
			fail("TOO_MANY_REQUESTS", "RATE_LIMITED");
		}
		const link = await getFamilyLinkByTokenHash(hashFamilyLinkToken(input.token));
		if (!link) {
			fail("NOT_FOUND", "FAMILY_LINK_NOT_FOUND");
		}

		await createReport({
			reporterFamilyLinkId: link.id,
			reportedUserId: link.profile.userId,
			reportedProfileId: link.profileId,
			category: input.category,
			context: "family_link",
			contextId: link.id,
			details: input.details ?? null,
		});
		return { ok: true as const };
	});
