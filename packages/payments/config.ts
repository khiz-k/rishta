import type { PaymentsConfig } from "./types";

/**
 * Rishta plans (spec.md §11, vision.md "Business model"). Billing is attached to the household
 * (organization) so a parent can pay for their child's household. Price IDs come from env vars.
 */
export const config: PaymentsConfig = {
	billingAttachedTo: "organization",
	requireActiveSubscription: false,
	plans: {
		free: {
			isFree: true,
		},
		premium: {
			recommended: true,
			prices: [
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_PRO_MONTHLY as string,
					interval: "month",
					amount: 29,
					currency: "USD",
					seatBased: false,
					trialPeriodDays: 7,
				},
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_PRO_YEARLY as string,
					interval: "year",
					amount: 290,
					currency: "USD",
					seatBased: false,
					trialPeriodDays: 7,
				},
			],
		},
		credits: {
			// Bought from Credits & plan, not the plan table: $5 for 5 credits.
			hidden: true,
			prices: [
				{
					type: "one-time",
					priceId: process.env.PRICE_ID_CREDITS_5 as string,
					amount: 5,
					currency: "USD",
				},
			],
		},
		// enterprise removed: a paid matchmaker seat is out of scope for the MVP.
	},
};

/** The plan id of the credit pack; its webhook grants credits instead of a plan. */
export const CREDIT_PACK_PLAN_ID = "credits";
