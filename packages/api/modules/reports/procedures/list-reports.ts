import {
	db,
	interest,
	listReports,
	message,
	REPORT_CATEGORIES,
	REPORT_CONTEXTS,
	REPORT_STATUSES,
	type ReportRow,
} from "@repo/database";
import { inArray } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure } from "../../../orpc/procedures";

const PAGE_SIZE = 25;

export const ReportViewSchema = z.object({
	id: z.string(),
	category: z.enum(REPORT_CATEGORIES),
	context: z.enum(REPORT_CONTEXTS),
	contextId: z.string(),
	status: z.enum(REPORT_STATUSES),
	details: z.string().nullable(),
	moderatorNote: z.string().nullable(),
	reportedPage: z.object({ handle: z.string(), displayName: z.string() }).nullable(),
	/** The reported note or message itself, for the moderator. The reporter is never included. */
	snippet: z.string().nullable(),
	fromFamilyLink: z.boolean(),
	createdAt: z.string(),
	resolvedAt: z.string().nullable(),
});

async function snippetsFor(rows: ReportRow[]) {
	const letterIds = rows.filter((row) => row.context === "letter").map((row) => row.contextId);
	const messageIds = rows.filter((row) => row.context === "message").map((row) => row.contextId);
	const [letters, messages] = await Promise.all([
		letterIds.length > 0
			? db.query.interest.findMany({
					where: inArray(interest.id, letterIds),
					columns: { id: true, message: true },
				})
			: Promise.resolve([]),
		messageIds.length > 0
			? db.query.message.findMany({
					where: inArray(message.id, messageIds),
					columns: { id: true, content: true },
				})
			: Promise.resolve([]),
	]);
	const snippets = new Map<string, string>();
	for (const letter of letters) {
		if (letter.message) {
			snippets.set(letter.id, letter.message);
		}
	}
	for (const row of messages) {
		snippets.set(row.id, row.content);
	}
	return snippets;
}

export const listReportsProcedure = adminProcedure
	.route({
		method: "GET",
		path: "/admin/reports",
		tags: ["Reports"],
		summary: "The moderation queue",
	})
	.input(
		z.object({
			status: z.enum(REPORT_STATUSES).optional(),
			cursor: z.iso.datetime().optional(),
		}),
	)
	.output(z.object({ items: z.array(ReportViewSchema), nextCursor: z.string().nullable() }))
	.handler(async ({ input }) => {
		const { items, hasMore } = await listReports({
			status: input.status,
			before: input.cursor ? new Date(input.cursor) : undefined,
			limit: PAGE_SIZE,
		});
		const snippets = await snippetsFor(items);
		const last = items[items.length - 1];

		return {
			items: items.map((row) => ({
				id: row.id,
				category: row.category,
				context: row.context,
				contextId: row.contextId,
				status: row.status,
				details: row.details,
				moderatorNote: row.moderatorNote,
				reportedPage: row.reportedProfile
					? {
							handle: row.reportedProfile.handle,
							displayName: row.reportedProfile.displayName,
						}
					: null,
				snippet: snippets.get(row.contextId)?.slice(0, 400) ?? null,
				fromFamilyLink: row.reporterFamilyLinkId !== null,
				createdAt: row.createdAt.toISOString(),
				resolvedAt: row.resolvedAt?.toISOString() ?? null,
			})),
			nextCursor: hasMore && last ? last.createdAt.toISOString() : null,
		};
	});
