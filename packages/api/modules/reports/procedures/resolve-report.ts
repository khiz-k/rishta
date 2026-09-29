import { biodataProfile, db, getReportById, report } from "@repo/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { adminProcedure } from "../../../orpc/procedures";

export const resolveReport = adminProcedure
	.route({
		method: "POST",
		path: "/admin/reports/{reportId}/resolve",
		tags: ["Reports"],
		summary: "Review, action or dismiss a report",
		description: "Actioned can pause the reported page.",
	})
	.input(
		z.object({
			reportId: z.string(),
			status: z.enum(["reviewing", "actioned", "dismissed"]),
			moderatorNote: z.string().trim().max(2000).optional(),
			pausePage: z.boolean().optional(),
		}),
	)
	.output(
		z.object({
			id: z.string(),
			status: z.enum(["open", "reviewing", "actioned", "dismissed"]),
			pagePaused: z.boolean(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const existing = await getReportById(input.reportId);
		if (!existing) {
			fail("NOT_FOUND", "REPORT_NOT_FOUND");
		}
		const now = new Date();
		const resolved = input.status !== "reviewing";

		await db
			.update(report)
			.set({
				status: input.status,
				moderatorNote: input.moderatorNote ?? existing.moderatorNote,
				resolvedByUserId: resolved ? user.id : existing.resolvedByUserId,
				resolvedAt: resolved ? now : null,
			})
			.where(eq(report.id, existing.id));

		const pagePaused =
			input.status === "actioned" &&
			input.pausePage === true &&
			existing.reportedProfileId !== null;
		if (pagePaused && existing.reportedProfileId) {
			await db
				.update(biodataProfile)
				.set({ status: "paused", isActive: false, pausedAt: now })
				.where(eq(biodataProfile.id, existing.reportedProfileId));
		}

		return { id: existing.id, status: input.status, pagePaused };
	});
