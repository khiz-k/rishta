import { getPurchasesByOrganizationId, getPurchasesByUserId } from "@repo/database";
import { getPlanIdByProviderPriceId, getPlanPriceByProviderPriceId } from "@repo/payments";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { canBill, requireHouseholdMember } from "../lib/billing-access";

export const listPurchases = protectedProcedure
	.route({
		method: "GET",
		path: "/payments/purchases",
		tags: ["Payments"],
		summary: "Get purchases",
		description: "Get all purchases of the current user or the provided organization",
	})
	.input(
		z.object({
			organizationId: z.string().optional(),
		}),
	)
	.handler(async ({ input: { organizationId }, context: { user } }) => {
		// A household's plan is visible to its own members only; its billing to the candidate and
		// guardians (spec.md §13), so family never receives the provider's customer or
		// subscription ids.
		const billing = organizationId
			? canBill((await requireHouseholdMember(organizationId, user.id)).role)
			: true;

		const purchases = organizationId
			? await getPurchasesByOrganizationId(organizationId)
			: await getPurchasesByUserId(user.id);

		return purchases.map((purchase) => ({
			...purchase,
			...(billing ? {} : { customerId: "", subscriptionId: null }),
			planId: getPlanIdByProviderPriceId(purchase.priceId),
			planPrice: getPlanPriceByProviderPriceId(purchase.priceId)?.price ?? null,
		}));
	});
