import { getBlockedUserIdsEitherWay, getKeptPages, getPagesByUserIds } from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { canReadFolio, getHouseholdContext } from "../../households/lib/context";

/** The household's kept pages as a light list; `folio.kept` returns the full pages. */
export const listShortlists = protectedProcedure
	.route({
		method: "GET",
		path: "/shortlists",
		tags: ["Shortlists"],
		summary: "List kept pages",
	})
	.input(z.object({ organizationId: z.string() }))
	.output(z.array(z.object({ handle: z.string(), displayName: z.string(), keptAt: z.string() })))
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		if (!canReadFolio(context)) {
			fail("FORBIDDEN", "ROLE_NOT_ALLOWED");
		}
		const kept = await getKeptPages(input.organizationId);
		const [pages, blocked] = await Promise.all([
			getPagesByUserIds(kept.map((row) => row.profileUserId)),
			context.page?.userId
				? getBlockedUserIdsEitherWay(context.page.userId)
				: Promise.resolve(new Set<string>()),
		]);
		const byUser = new Map(pages.map((page) => [page.userId, page]));

		return kept.flatMap((row) => {
			const page = byUser.get(row.profileUserId);
			if (!page || page.status !== "active" || blocked.has(row.profileUserId)) {
				return [];
			}
			return [
				{
					handle: page.handle,
					displayName: page.displayName,
					keptAt: row.createdAt.toISOString(),
				},
			];
		});
	});
