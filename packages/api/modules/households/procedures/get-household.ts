import {
	countHouseholdMembers,
	getHouseholdById,
	getHouseholdBySlug,
	getPreferenceByOrganizationId,
	PLAN_LIMITS,
} from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { firstNameOf } from "../../biodata/lib/page-view";
import { getHouseholdContext, type HouseholdRole } from "../lib/context";
import { getEntitlements } from "../lib/entitlements";
import { HouseholdSchema } from "../types";

function toRole(role: string): HouseholdRole {
	return role === "owner" || role === "admin" ? role : "member";
}

export const getHousehold = protectedProcedure
	.route({
		method: "GET",
		path: "/households/{organizationSlug}",
		tags: ["Households"],
		summary: "Get a household by slug",
	})
	.input(z.object({ organizationSlug: z.string().min(1) }))
	.output(HouseholdSchema)
	.handler(async ({ input, context: { user } }) => {
		const household = await getHouseholdBySlug(input.organizationSlug);
		if (!household) {
			// The same answer as for a household you are not in, so a stranger cannot probe which
			// slugs (made from a first name) exist.
			fail("FORBIDDEN", "NOT_A_MEMBER");
		}

		const context = await getHouseholdContext(household.id, user.id);
		const [entitlements, seatsUsed, preference, full] = await Promise.all([
			getEntitlements(household.id),
			countHouseholdMembers(household.id),
			getPreferenceByOrganizationId(household.id),
			getHouseholdById(household.id),
		]);
		const page = context.page;

		return {
			id: household.id,
			slug: household.slug,
			name: household.name,
			role: context.role,
			isCandidate: context.isCandidate,
			candidate: {
				userId: page?.userId ?? null,
				firstName: firstNameOf(page?.displayName ?? household.name),
				displayName: page?.displayName ?? household.name,
			},
			page: page
				? {
						handle: page.handle,
						status: page.status,
						timeZone: page.timeZone,
						publishedAt: page.publishedAt?.toISOString() ?? null,
					}
				: null,
			lookingForComplete: Boolean(preference?.completedAt),
			settings: context.settings,
			plan: entitlements.plan,
			seatsUsed,
			seatsLimit: 1 + PLAN_LIMITS[entitlements.plan].familySeats,
			members: (full?.members ?? []).map((row) => ({
				userId: row.userId,
				name: row.user.name,
				role: toRole(row.role),
				label: context.settings.memberLabels[row.userId] ?? null,
				isCandidate: row.userId === page?.userId,
			})),
		};
	});
