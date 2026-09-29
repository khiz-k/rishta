import { BIODATA_STATUSES, updatePage } from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { requireCandidate } from "../../households/lib/context";

const StatusSchema = z.object({ status: z.enum(BIODATA_STATUSES) });

export const pausePage = protectedProcedure
	.route({
		method: "POST",
		path: "/profiles/pause",
		tags: ["Profiles"],
		summary: "Pause the page (nobody new sees it)",
	})
	.input(z.object({ organizationId: z.string() }))
	.output(StatusSchema)
	.handler(async ({ input, context: { user } }) => {
		const context = await requireCandidate(input.organizationId, user.id);
		if (context.page.status !== "active") {
			fail("PRECONDITION_FAILED", "PAGE_NOT_ACTIVE");
		}
		await updatePage(input.organizationId, {
			status: "paused",
			isActive: false,
			pausedAt: new Date(),
		});
		return { status: "paused" as const };
	});

export const resumePage = protectedProcedure
	.route({
		method: "POST",
		path: "/profiles/resume",
		tags: ["Profiles"],
		summary: "Resume a paused page",
	})
	.input(z.object({ organizationId: z.string() }))
	.output(StatusSchema)
	.handler(async ({ input, context: { user } }) => {
		const context = await requireCandidate(input.organizationId, user.id);
		if (context.page.status !== "paused") {
			fail("PRECONDITION_FAILED", "PAGE_NOT_ACTIVE");
		}
		if (!context.page.publishedAt) {
			// A page that was never published goes through publish, with its checks.
			fail("PRECONDITION_FAILED", "PAGE_INCOMPLETE");
		}
		await updatePage(input.organizationId, {
			status: "active",
			isActive: true,
			pausedAt: null,
			closedReason: null,
		});
		return { status: "active" as const };
	});
