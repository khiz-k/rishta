import { and, desc, eq, lt } from "drizzle-orm";

import { db } from "../client";
import type { ReportStatus } from "../domain";
import { report } from "../schema/postgres";

export async function createReport(values: typeof report.$inferInsert) {
	const [created] = await db.insert(report).values(values).returning();
	return created;
}

export async function getReportById(reportId: string) {
	return db.query.report.findFirst({
		where: eq(report.id, reportId),
		with: { reportedProfile: { columns: { id: true, handle: true, displayName: true } } },
	});
}

export async function listReports(params: { status?: ReportStatus; before?: Date; limit: number }) {
	const rows = await db.query.report.findMany({
		where: and(
			params.status ? eq(report.status, params.status) : undefined,
			params.before ? lt(report.createdAt, params.before) : undefined,
		),
		with: { reportedProfile: { columns: { id: true, handle: true, displayName: true } } },
		orderBy: [desc(report.createdAt)],
		limit: params.limit + 1,
	});
	return { items: rows.slice(0, params.limit), hasMore: rows.length > params.limit };
}
