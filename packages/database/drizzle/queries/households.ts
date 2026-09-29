import { and, eq, sql } from "drizzle-orm";

import { db } from "../client";
import { PLAN_LIMITS, type HouseholdPlan } from "../domain";
import {
	biodataProfile,
	householdSetting,
	member,
	organization,
	purchase,
} from "../schema/postgres";

/** Subscription statuses that count as Premium (Stripe status strings). */
const PREMIUM_STATUSES = new Set(["active", "trialing"]);

/**
 * The household's plan. Premium is the only subscription plan, so any active or trialing
 * subscription attached to the household counts, whichever price it was bought at.
 */
export async function getHouseholdPlan(organizationId: string): Promise<HouseholdPlan> {
	return (await getHouseholdSubscription(organizationId)).plan;
}

/** The plan plus whether Premium is still in its free trial (monthly credits start when paid). */
export async function getHouseholdSubscription(
	organizationId: string,
): Promise<{ plan: HouseholdPlan; trialing: boolean }> {
	const purchases = await db.query.purchase.findMany({
		where: and(eq(purchase.organizationId, organizationId), eq(purchase.type, "SUBSCRIPTION")),
		columns: { status: true },
	});
	const live = purchases.filter((row) => PREMIUM_STATUSES.has(row.status ?? "active"));
	if (live.length === 0) {
		return { plan: "free", trialing: false };
	}
	return { plan: "premium", trialing: live.every((row) => row.status === "trialing") };
}

/** Total members a household may hold: the candidate plus the plan's family seats. */
export async function getHouseholdMembershipLimit(organizationId: string) {
	const plan = await getHouseholdPlan(organizationId);
	return 1 + PLAN_LIMITS[plan].familySeats;
}

export async function countHouseholdMembers(organizationId: string) {
	const [row] = await db
		.select({ count: sql<number>`count(*)` })
		.from(member)
		.where(eq(member.organizationId, organizationId));
	return Number(row?.count ?? 0);
}

export async function getHouseholdSetting(organizationId: string) {
	return db.query.householdSetting.findFirst({
		where: eq(householdSetting.organizationId, organizationId),
	});
}

/** The household with its settings, page and members (members include their user). */
export async function getHouseholdById(organizationId: string) {
	return db.query.organization.findFirst({
		where: eq(organization.id, organizationId),
		with: {
			householdSetting: true,
			biodataProfile: true,
			members: { with: { user: { columns: { id: true, name: true, email: true } } } },
		},
	});
}

export async function getHouseholdBySlug(slug: string) {
	return db.query.organization.findFirst({
		where: eq(organization.slug, slug),
		with: {
			householdSetting: true,
			biodataProfile: true,
		},
	});
}

/** Households a user belongs to, with their page status, for the "Searching for" switcher. */
export async function getHouseholdsForUser(userId: string) {
	return db
		.select({
			organizationId: organization.id,
			slug: organization.slug,
			name: organization.name,
			role: member.role,
			pageStatus: biodataProfile.status,
			candidateName: biodataProfile.displayName,
		})
		.from(member)
		.innerJoin(organization, eq(organization.id, member.organizationId))
		.leftJoin(biodataProfile, eq(biodataProfile.organizationId, organization.id))
		.where(eq(member.userId, userId));
}
