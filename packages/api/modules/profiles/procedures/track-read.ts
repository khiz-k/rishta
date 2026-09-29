import { recordRead } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { getHouseholdContext } from "../../households/lib/context";
import { loadPageForViewer } from "../lib/viewer";

/**
 * Records that a household read a page, once per pair. Skipped for the household's own page,
 * when reading privately (incognito), and for pages the household has no candidate for yet.
 */
export async function trackPageRead(params: {
	organizationId: string;
	userId: string;
	handle: string;
}) {
	const context = await getHouseholdContext(params.organizationId, params.userId);
	const { page, relation } = await loadPageForViewer(context, params.handle);

	if (
		relation.relationship === "self" ||
		relation.relationship === "household" ||
		context.settings.readIncognito ||
		!context.page?.userId ||
		!page.userId
	) {
		return false;
	}

	// Readers are households, shown by their candidate's page.
	return recordRead({
		viewerUserId: context.page.userId,
		viewerOrganizationId: context.organizationId,
		profileUserId: page.userId,
	});
}

export const trackRead = protectedProcedure
	.route({
		method: "POST",
		path: "/profiles/read",
		tags: ["Profiles"],
		summary: "Record a read of a page",
	})
	.input(z.object({ handle: z.string().min(4).max(12), organizationId: z.string() }))
	.output(z.object({ tracked: z.boolean() }))
	.handler(async ({ input, context: { user } }) => {
		const tracked = await trackPageRead({
			organizationId: input.organizationId,
			userId: user.id,
			handle: input.handle,
		});
		return { tracked };
	});
