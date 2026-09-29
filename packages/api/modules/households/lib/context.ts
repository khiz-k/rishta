import {
	getHouseholdSetting,
	getPageByOrganizationId,
	type HouseholdSettingRow,
} from "@repo/database";

import { fail, type RishtaErrorCode } from "../../../lib/errors";
import type { PageWithPhotos } from "../../biodata/lib/page-view";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

/**
 * Household roles (spec.md §13): owner = the candidate (after claim; the drafter before it),
 * admin = a guardian, member = family.
 */
export type HouseholdRole = "owner" | "admin" | "member";

export type HouseholdSettings = Omit<HouseholdSettingRow, "createdAt" | "updatedAt">;

export interface HouseholdContext {
	organizationId: string;
	organizationName: string;
	slug: string;
	userId: string;
	role: HouseholdRole;
	/** The signed-in user is the page's candidate (only they can seal, say yes or close). */
	isCandidate: boolean;
	page: PageWithPhotos | null;
	settings: HouseholdSettings;
}

function toHouseholdRole(role: string): HouseholdRole {
	if (role === "owner" || role === "admin") {
		return role;
	}
	return "member";
}

/** Defaults for households created before `household_setting` existed. */
export function defaultHouseholdSettings(organizationId: string): HouseholdSettings {
	return {
		organizationId,
		candidateRelation: "self",
		pendingCandidateEmail: null,
		familyReadsFolio: true,
		familyEditsPage: false,
		familySeesIntroductions: false,
		familyLinksAllowed: true,
		familyLanguage: "hi",
		readIncognito: false,
		discreetEmails: true,
		keyboardShortcuts: true,
		folioReleaseHour: 19,
		memberLabels: {},
	};
}

/** The household as the member sees it, or null when the user is not in it (or it doesn't exist). */
async function findHouseholdContext(
	organizationId: string,
	userId: string,
): Promise<HouseholdContext | null> {
	const membership = await verifyOrganizationMembership(organizationId, userId);

	if (!membership) {
		return null;
	}

	const [page, settings] = await Promise.all([
		getPageByOrganizationId(organizationId),
		getHouseholdSetting(organizationId),
	]);

	const {
		createdAt: _createdAt,
		updatedAt: _updatedAt,
		...storedSettings
	} = settings ?? {
		...defaultHouseholdSettings(organizationId),
		createdAt: null,
		updatedAt: null,
	};

	return {
		organizationId,
		organizationName: membership.organization.name,
		slug: membership.organization.slug,
		userId,
		role: toHouseholdRole(membership.role),
		isCandidate: Boolean(page?.userId && page.userId === userId),
		page: page ?? null,
		settings: storedSettings,
	};
}

/** Loads the household and verifies membership (every household-scoped procedure calls this). */
export async function getHouseholdContext(
	organizationId: string,
	userId: string,
): Promise<HouseholdContext> {
	const context = await findHouseholdContext(organizationId, userId);
	if (!context) {
		fail("FORBIDDEN", "NOT_A_MEMBER");
	}
	return context;
}

/**
 * A household-scoped record looked up by its id (a photo, a folio page, a pencil note, a family
 * link), with the caller's household context. Membership is checked before the record is
 * trusted, and a missing record and one from a household the caller is not in answer the same
 * `NOT_FOUND` `notFound`, so an id never tells a stranger whether it exists (quality rule S1).
 */
export async function getHouseholdRow<T extends { organizationId: string }>(
	row: T | null | undefined,
	userId: string,
	notFound: RishtaErrorCode,
): Promise<{ row: T; context: HouseholdContext }> {
	const context = row ? await findHouseholdContext(row.organizationId, userId) : null;
	if (!row || !context) {
		fail("NOT_FOUND", notFound);
	}
	return { row, context };
}

export function assertHouseholdRole(context: HouseholdContext, allowed: readonly HouseholdRole[]) {
	if (!allowed.includes(context.role)) {
		fail("FORBIDDEN", "ROLE_NOT_ALLOWED");
	}
}

export async function requireHousehold(
	organizationId: string,
	userId: string,
	allowed: readonly HouseholdRole[],
) {
	const context = await getHouseholdContext(organizationId, userId);
	assertHouseholdRole(context, allowed);
	return context;
}

/** Owner who is also the claimed page's candidate: seal, answer, withdraw, close, readers. */
export async function requireCandidate(organizationId: string, userId: string) {
	const context = await getHouseholdContext(organizationId, userId);
	if (context.role !== "owner" || !context.isCandidate) {
		fail("FORBIDDEN", "CANDIDATE_ONLY");
	}
	return context as HouseholdContext & { page: PageWithPhotos };
}

export function requirePage(context: HouseholdContext): PageWithPhotos {
	if (!context.page) {
		fail("NOT_FOUND", "PAGE_NOT_FOUND");
	}
	return context.page;
}

export function isPageClaimed(page: PageWithPhotos | null) {
	return Boolean(page?.userId) && page?.status !== "awaiting_claim";
}

/** The owner edits; a guardian edits if allowed, and always before the page is claimed. */
export function canEditPage(context: HouseholdContext) {
	if (context.role === "owner") {
		return true;
	}
	if (context.role === "admin") {
		return context.settings.familyEditsPage || !isPageClaimed(context.page);
	}
	return false;
}

export function assertCanEditPage(context: HouseholdContext) {
	if (!canEditPage(context)) {
		fail("FORBIDDEN", "PAGE_EDIT_NOT_ALLOWED");
	}
}

/** Guardians and family read the folio and kept pages only if the candidate allows it. */
export function canReadFolio(context: HouseholdContext) {
	return context.role === "owner" || context.settings.familyReadsFolio;
}

/** The signed-in member is the claimed page's own candidate (the owner who holds the seal). */
export function isCandidateReader(context: HouseholdContext) {
	return context.role === "owner" && context.isCandidate;
}

/**
 * Whose letters may be read beside a page: the candidate's, and only by the candidate. Letters
 * and introductions are private to the candidate (spec.md F7 and §13, "Priya's letters are
 * private to her"; F9, the seals open to each other), so for a guardian or family member this
 * is null. Their pages then read as a stranger's would: the sealed section shut, no photo
 * opened by a note, no letter state.
 */
export function letterReaderUserId(context: HouseholdContext): string | null {
	return isCandidateReader(context) ? context.userId : null;
}

/** The name a household member signs pencil notes with ("Ammi"), else their first name. */
export function memberLabelFor(
	settings: HouseholdSettings,
	userId: string,
	fallbackName: string | null | undefined,
) {
	const label = settings.memberLabels[userId];
	if (label && label.trim().length > 0) {
		return label.trim();
	}
	const name = (fallbackName ?? "").trim().split(/\s+/)[0];
	return name && name.length > 0 ? name : "Family";
}
