import { applyMonthlyCreditGrant, getHouseholdSubscription, PLAN_LIMITS } from "@repo/database";

/**
 * Entitlements per household (spec.md §11). They read the household's active purchase, not the
 * user's, so a parent paying for their child's household unlocks Premium for that household.
 */
export async function getEntitlements(organizationId: string) {
	const { plan, trialing } = await getHouseholdSubscription(organizationId);
	return { plan, trialing, ...PLAN_LIMITS[plan] };
}

export type Entitlements = Awaited<ReturnType<typeof getEntitlements>>;

/**
 * Premium includes 2 credits each month, granted lazily the first time the wallet is read.
 * The grant starts with the paid period, not during the 7-day free trial.
 */
export async function applyMonthlyGrantIfDue(organizationId: string, entitlements: Entitlements) {
	if (entitlements.monthlyCredits > 0 && !entitlements.trialing) {
		await applyMonthlyCreditGrant({ organizationId, credits: entitlements.monthlyCredits });
	}
}
