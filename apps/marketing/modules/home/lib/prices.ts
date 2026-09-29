import { config as paymentsConfig } from "@repo/payments/config";
import type { PlanPrice } from "@repo/payments/types";

/**
 * The prices the letter quotes, read from packages/payments/config.ts so the paragraph can never
 * disagree with checkout: Premium monthly and yearly (with the trial) and the credit pack.
 */
function findPrice(planId: string, matches: (price: PlanPrice) => boolean) {
	const plan = paymentsConfig.plans[planId];
	if (!plan || !("prices" in plan)) {
		return undefined;
	}
	return plan.prices.find(matches);
}

export function getLetterPrices() {
	const monthly = findPrice(
		"premium",
		(price) => price.type === "subscription" && price.interval === "month",
	);
	const yearly = findPrice(
		"premium",
		(price) => price.type === "subscription" && price.interval === "year",
	);
	const credits = findPrice("credits", (price) => price.type === "one-time");
	const trialDays =
		monthly && monthly.type === "subscription" ? (monthly.trialPeriodDays ?? 0) : 0;

	return {
		currency: monthly?.currency ?? "USD",
		monthly: monthly?.amount ?? 0,
		yearly: yearly?.amount ?? 0,
		credits: credits?.amount ?? 0,
		creditsCurrency: credits?.currency ?? monthly?.currency ?? "USD",
		trialDays,
	};
}
