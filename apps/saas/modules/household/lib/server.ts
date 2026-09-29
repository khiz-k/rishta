import "server-only";
import { getOrganizationList, getSession } from "@auth/lib/server";
import type { Household } from "@shared/lib/api-types";
import { redirect } from "next/navigation";
import { cache } from "react";

/** The household a signed-in person last read for, else their first. */
export const getActiveHouseholdSlug = cache(async () => {
	const session = await getSession();
	if (!session) {
		return null;
	}
	const organizations = await getOrganizationList();
	const active =
		organizations.find((org) => org.id === session.session.activeOrganizationId) ??
		organizations.find((org) => org.id === session.user.lastActiveOrganizationId) ??
		organizations[0];
	return active?.slug ?? null;
});

/** Legacy routes and "/" land in the active household (design.md §3.4). */
export async function redirectToHousehold(path = ""): Promise<never> {
	const slug = await getActiveHouseholdSlug();
	if (!slug) {
		redirect("/onboarding");
	}
	redirect(`/${slug}${path}`);
}

/**
 * The household gate, in order (design.md §3.5):
 * 1. awaiting claim and you are the invited candidate → Claim your page
 * 2. Looking for not complete (for whoever may draft it) → The first page
 * 3. the candidate's page not yet published → My Biodata, with the Publish bar
 * 4. otherwise the Folio (which shows its own locked states to everyone else).
 */
export function householdGate(household: Household, userEmail: string): string | null {
	const base = `/${household.slug}`;
	const page = household.page;
	const invited = household.settings.pendingCandidateEmail?.toLowerCase();

	if (page?.status === "awaiting_claim" && invited && invited === userEmail.toLowerCase()) {
		return `${base}/claim`;
	}

	const canDraftLookingFor =
		household.role === "owner" ||
		(household.role === "admin" &&
			(!page || page.status === "awaiting_claim" || !household.candidate.userId));
	if (!household.lookingForComplete && canDraftLookingFor) {
		return `${base}/begin`;
	}

	if (household.isCandidate && page?.status === "draft") {
		return `${base}/biodata`;
	}

	return null;
}
