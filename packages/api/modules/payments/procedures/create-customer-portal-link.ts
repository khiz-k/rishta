import { ORPCError } from "@orpc/client";
import { getPurchaseById } from "@repo/database";
import { logger } from "@repo/logs";
import { createCustomerPortalLink as createCustomerPortalLinkFn } from "@repo/payments";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { localeMiddleware } from "../../../orpc/middleware/locale-middleware";
import { protectedProcedure } from "../../../orpc/procedures";
import { requireBillingAccess } from "../lib/billing-access";

export const createCustomerPortalLink = protectedProcedure
	.use(localeMiddleware)
	.route({
		method: "POST",
		path: "/payments/create-customer-portal-link",
		tags: ["Payments"],
		summary: "Create customer portal link",
		description:
			"Creates a customer portal link for the customer or team. If a purchase is provided, the link will be created for the customer of the purchase.",
	})
	.input(
		z.object({
			purchaseId: z.string(),
			redirectUrl: z.string().optional(),
		}),
	)
	.handler(async ({ input: { purchaseId, redirectUrl }, context: { user } }) => {
		const purchase = await getPurchaseById(purchaseId);

		// A missing purchase, another household's and someone else's personal one all answer
		// `NOT_A_MEMBER`, so a purchase id never tells a stranger whether it exists (rule S1).
		if (!purchase) {
			fail("FORBIDDEN", "NOT_A_MEMBER");
		}

		if (purchase.organizationId) {
			// A household's billing: the candidate or a guardian (spec.md §13).
			await requireBillingAccess(purchase.organizationId, user.id);
		} else if (purchase.userId !== user.id) {
			// A personal purchase: its buyer only (and never a purchase that belongs to nobody).
			fail("FORBIDDEN", "NOT_A_MEMBER");
		}

		try {
			const customerPortalLink = await createCustomerPortalLinkFn({
				subscriptionId: purchase.subscriptionId ?? undefined,
				customerId: purchase.customerId,
				redirectUrl,
			});

			if (!customerPortalLink) {
				throw new ORPCError("INTERNAL_SERVER_ERROR");
			}

			return { customerPortalLink };
		} catch (e) {
			logger.error("Could not create customer portal link", e);
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
	});
