import { getPreferenceByOrganizationId, updatePage } from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { ageFromDateOfBirth } from "../../../lib/time";
import { protectedProcedure } from "../../../orpc/procedures";
import { requireCandidate } from "../../households/lib/context";
import { missingRequiredFields } from "../lib/completeness";

export const publishPage = protectedProcedure
	.route({
		method: "POST",
		path: "/profiles/publish",
		tags: ["Profiles"],
		summary: "Publish the page",
		description:
			"Checks the required fields, 18+, a claimed page, a complete Looking for and a verified email.",
	})
	.input(z.object({ organizationId: z.string() }))
	.output(z.object({ status: z.literal("active"), publishedAt: z.string() }))
	.handler(async ({ input, context: { user } }) => {
		const context = await requireCandidate(input.organizationId, user.id);
		const page = context.page;

		if (page.status === "closed") {
			fail("CONFLICT", "PAGE_CLOSED");
		}
		const missing = missingRequiredFields(page);
		if (missing.length > 0) {
			fail("PRECONDITION_FAILED", "PAGE_INCOMPLETE", { missing: missing.join(",") });
		}
		if (page.dateOfBirth && ageFromDateOfBirth(page.dateOfBirth) < 18) {
			fail("PRECONDITION_FAILED", "UNDER_18");
		}
		if (!user.emailVerified) {
			fail("PRECONDITION_FAILED", "EMAIL_NOT_VERIFIED");
		}
		const preference = await getPreferenceByOrganizationId(input.organizationId);
		if (!preference?.completedAt) {
			fail("PRECONDITION_FAILED", "LOOKING_FOR_INCOMPLETE");
		}

		const publishedAt = page.publishedAt ?? new Date();
		await updatePage(input.organizationId, {
			status: "active",
			isActive: true,
			publishedAt,
			pausedAt: null,
			closedReason: null,
			verification: page.verification === "none" ? "email" : page.verification,
			isVerified: true,
		});

		return { status: "active" as const, publishedAt: publishedAt.toISOString() };
	});
