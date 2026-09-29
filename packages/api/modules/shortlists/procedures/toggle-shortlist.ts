import { db, shortlist } from "@repo/database";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { getHouseholdContext } from "../../households/lib/context";
import { loadPageForViewer } from "../../profiles/lib/viewer";

/** Keep or unkeep a page from anywhere (a thin alias over kept pages, household-scoped). */
export const toggleShortlist = protectedProcedure
	.route({
		method: "POST",
		path: "/shortlists/toggle",
		tags: ["Shortlists"],
		summary: "Keep or unkeep a page",
	})
	.input(z.object({ organizationId: z.string(), handle: z.string().min(4).max(12) }))
	.output(z.object({ kept: z.boolean() }))
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		if (context.role === "member") {
			fail("FORBIDDEN", "ROLE_NOT_ALLOWED");
		}
		const candidateUserId = context.page?.userId;
		if (!candidateUserId) {
			fail("PRECONDITION_FAILED", "PAGE_AWAITING_CLAIM");
		}

		const { page } = await loadPageForViewer(context, input.handle);
		if (!page.userId || page.organizationId === input.organizationId) {
			fail("BAD_REQUEST", "PAGE_UNAVAILABLE");
		}

		const existing = await db.query.shortlist.findFirst({
			where: and(
				eq(shortlist.organizationId, input.organizationId),
				eq(shortlist.profileUserId, page.userId),
			),
		});
		if (existing) {
			await db.delete(shortlist).where(eq(shortlist.id, existing.id));
			return { kept: false };
		}

		await db.insert(shortlist).values({
			organizationId: input.organizationId,
			userId: candidateUserId,
			profileUserId: page.userId,
			keptByUserId: user.id,
		});
		return { kept: true };
	});
