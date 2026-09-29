import { biodataProfile, db } from "@repo/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { OkSchema } from "../../biodata/types";
import { requireCandidate } from "../lib/context";

export const setClosingStory = protectedProcedure
	.route({
		method: "POST",
		path: "/households/{organizationId}/closing-story",
		tags: ["Households"],
		summary: "Share how you met (optional, after closing)",
	})
	.input(z.object({ organizationId: z.string(), story: z.string().trim().max(2000).nullable() }))
	.output(OkSchema)
	.handler(async ({ input, context: { user } }) => {
		const context = await requireCandidate(input.organizationId, user.id);
		if (context.page.status !== "closed") {
			fail("PRECONDITION_FAILED", "PAGE_NOT_ACTIVE");
		}
		await db
			.update(biodataProfile)
			.set({ closingStory: input.story })
			.where(eq(biodataProfile.organizationId, input.organizationId));
		return { ok: true as const };
	});
