import type { PaymentsConfig } from "./types";

export const config: PaymentsConfig = {
	billingAttachedTo: "organization",
	requireActiveSubscription: false,
	plans: {
		free: {
			isFree: true,
		},
		pro: {
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
		enterprise: {
			isEnterprise: true,
		},
	},
};
