import { getFolioForDate, getLatestFolio, getPreferenceByOrganizationId } from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { firstNameOf } from "../../biodata/lib/page-view";
import { canReadFolio, getHouseholdContext, isPageClaimed } from "../../households/lib/context";
import { getEntitlements } from "../../households/lib/entitlements";
import { generateFolio } from "../lib/generate";
import { presentFolioPages } from "../lib/present";
import { getReleaseWindow } from "../lib/release";
import { FolioTodaySchema } from "../types";

export const getToday = protectedProcedure
	.route({
		method: "GET",
		path: "/folio/today",
		tags: ["Folio"],
		summary: "Today's folio",
		description:
			"5 pages on Free, 7 on Premium, released each evening in the household's time zone. Generated lazily; never returns a score.",
	})
	.input(z.object({ organizationId: z.string() }))
	.output(FolioTodaySchema)
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		if (!canReadFolio(context)) {
			fail("FORBIDDEN", "ROLE_NOT_ALLOWED");
		}

		const page = context.page;
		const now = new Date();
		const timeZone = page?.timeZone ?? "America/New_York";
		const window = getReleaseWindow(now, timeZone, context.settings.folioReleaseHour);
		const entitlements = await getEntitlements(input.organizationId);
		const viewer = {
			role: context.role,
			isCandidate: context.isCandidate,
			candidateFirstName: firstNameOf(page?.displayName ?? context.organizationName),
		};
		const empty = {
			releaseDate: null,
			nextReleaseAt: window.nextReleaseAt.toISOString(),
			size: entitlements.folioSize,
			firstRelease: false,
			viewer,
			pages: [],
		};

		if (!page || !isPageClaimed(page)) {
			return { ...empty, locked: "awaiting_claim" as const };
		}
		if (page.status === "closed") {
			return { ...empty, locked: "closed" as const };
		}
		if (page.status === "paused") {
			return { ...empty, locked: "paused" as const };
		}
		const preference = await getPreferenceByOrganizationId(input.organizationId);
		if (page.status !== "active" || !page.publishedAt || !preference?.completedAt) {
			return { ...empty, locked: "unpublished" as const };
		}

		let current: Awaited<ReturnType<typeof getFolioForDate>> | null = await getFolioForDate(
			input.organizationId,
			window.releaseDate,
		);

		if (!current) {
			if (page.publishedAt.getTime() > window.releasedAt.getTime()) {
				// Published after this release: the previous folio stays current, or the first is on its way.
				const previous = await getLatestFolio(input.organizationId);
				if (!previous) {
					return { ...empty, locked: null, firstRelease: true };
				}
				current = previous;
			} else {
				current = await generateFolio({
					organizationId: input.organizationId,
					page,
					preference,
					releaseDate: window.releaseDate,
					size: entitlements.folioSize,
					now,
				});
			}
		}

		if (!current) {
			return { ...empty, locked: null };
		}

		return {
			releaseDate: current.releaseDate,
			nextReleaseAt: window.nextReleaseAt.toISOString(),
			size: current.size,
			locked: null,
			firstRelease: false,
			viewer,
			pages: await presentFolioPages(context, current.pages),
		};
	});
