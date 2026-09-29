import { getHouseholdBySlug } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { firstNameOf, toPageView } from "../../biodata/lib/page-view";
import { PageViewSchema } from "../../biodata/types";
import { loadClaimableHousehold } from "./claim-page";

/**
 * "Claim your page": the draft a relative wrote, read-only, for the invited candidate only.
 * "Nothing about you is visible to anyone until you confirm it."
 */
export const getClaim = protectedProcedure
	.route({
		method: "GET",
		path: "/households/{organizationSlug}/claim",
		tags: ["Households"],
		summary: "The drafted page waiting for its candidate",
	})
	.input(z.object({ organizationSlug: z.string().min(1) }))
	.output(
		z.object({
			organizationId: z.string(),
			candidateFirstName: z.string(),
			drafters: z.array(z.object({ name: z.string(), label: z.string().nullable() })),
			page: PageViewSchema,
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		// An unknown slug gets the same answer as any claim that is not yours.
		const found = await getHouseholdBySlug(input.organizationSlug);
		const { household, page } = await loadClaimableHousehold(found?.id ?? null, user);
		const labels = household.householdSetting?.memberLabels ?? {};

		return {
			organizationId: household.id,
			candidateFirstName: firstNameOf(page.displayName),
			drafters: household.members
				.filter((row) => row.userId !== user.id)
				.map((row) => ({ name: row.user.name, label: labels[row.userId] ?? null })),
			page: await toPageView({ ...page, photos: [] }, "household"),
		};
	});
