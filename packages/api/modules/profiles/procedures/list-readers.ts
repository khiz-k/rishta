import {
	getBlockedUserIdsEitherWay,
	getPagesByUserIds,
	listReaders as listReaderRows,
} from "@repo/database";
import { z } from "zod";

import { ageFromDateOfBirth } from "../../../lib/time";
import { protectedProcedure } from "../../../orpc/procedures";
import { requireCandidate } from "../../households/lib/context";

const PAGE_SIZE = 30;

export const listReaders = protectedProcedure
	.route({
		method: "GET",
		path: "/profiles/readers",
		tags: ["Profiles"],
		summary: "Who read my page",
		description: "Newest first, no photos, no totals. Blocked people never appear.",
	})
	.input(z.object({ organizationId: z.string(), cursor: z.string().datetime().optional() }))
	.output(
		z.object({
			items: z.array(
				z.object({
					handle: z.string(),
					displayName: z.string(),
					age: z.number().int().nullable(),
					city: z.string().nullable(),
					readAt: z.string(),
				}),
			),
			nextCursor: z.string().nullable(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const context = await requireCandidate(input.organizationId, user.id);
		const blocked = await getBlockedUserIdsEitherWay(user.id);

		const rows = await listReaderRows({
			profileUserId: context.page.userId ?? user.id,
			excludeUserIds: Array.from(blocked),
			before: input.cursor ? new Date(input.cursor) : undefined,
			limit: PAGE_SIZE + 1,
		});
		const pageRows = rows.slice(0, PAGE_SIZE);
		const pages = await getPagesByUserIds(pageRows.map((row) => row.viewerUserId));
		const byUser = new Map(pages.map((page) => [page.userId, page]));

		const items = pageRows.flatMap((row) => {
			const page = byUser.get(row.viewerUserId);
			if (!page || page.status === "awaiting_claim") {
				return [];
			}
			return [
				{
					handle: page.handle,
					displayName: page.displayName,
					age: page.dateOfBirth ? ageFromDateOfBirth(page.dateOfBirth) : null,
					city: page.location,
					readAt: row.createdAt.toISOString(),
				},
			];
		});

		const last = pageRows[pageRows.length - 1];
		return {
			items,
			nextCursor: rows.length > PAGE_SIZE && last ? last.createdAt.toISOString() : null,
		};
	});
