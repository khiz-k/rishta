import { fail } from "../../../lib/errors";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

/** Billing and credits belong to the candidate (owner) and guardians (admin) (spec.md §13). */
export const BILLING_ROLES: readonly string[] = ["owner", "admin"];

export function canBill(role: string) {
	return BILLING_ROLES.includes(role);
}

/** Every household member may see which plan the household is on. */
export async function requireHouseholdMember(organizationId: string, userId: string) {
	const membership = await verifyOrganizationMembership(organizationId, userId);
	if (!membership) {
		fail("FORBIDDEN", "NOT_A_MEMBER");
	}
	return membership;
}

/** Checkout and the billing portal: a member who is the candidate or a guardian. */
export async function requireBillingAccess(organizationId: string, userId: string) {
	const membership = await requireHouseholdMember(organizationId, userId);
	if (!canBill(membership.role)) {
		fail("FORBIDDEN", "ROLE_NOT_ALLOWED");
	}
	return membership;
}
