import { auth } from "@repo/auth";
import {
	getHouseholdSetting,
	getOrganizationMembership,
	getPageByOrganizationId,
} from "@repo/database";
import { vi } from "vitest";

import type { PageWithPhotos } from "../modules/biodata/lib/page-view";
import {
	defaultHouseholdSettings,
	type HouseholdSettings,
} from "../modules/households/lib/context";
import { FIXTURE_CREATED_AT, pageRow } from "./test-fixtures";

/**
 * Procedure-test helpers for Priya's household (spec.md §14): Priya is the owner and the
 * candidate, her mother Sunita ("Ammi") a guardian (admin), her brother Kabir family (member).
 * Each test file mocks `@repo/auth` and `@repo/database` itself; these helpers only program
 * those mocks, so they must be called after the file's `vi.mock` calls.
 */
export const procedureContext = { headers: new Headers() };

export const PRIYA_ROLES: Record<string, "owner" | "admin" | "member"> = {
	"user-priya": "owner",
	"user-sunita": "admin",
	"user-kabir": "member",
};

export const priyaPage: PageWithPhotos = { ...pageRow({ handle: "prs482" }), photos: [] };

export function signedInAs(
	userId: string,
	overrides: { email?: string; emailVerified?: boolean } = {},
) {
	vi.mocked(auth.api.getSession).mockResolvedValue({
		user: {
			id: userId,
			email: overrides.email ?? `${userId}@example.com`,
			emailVerified: overrides.emailVerified ?? true,
			name: userId,
			role: "user",
		},
		session: { id: `session-${userId}`, userId },
	} as never);
}

/** Programs membership, the household page and its settings for Priya's household. */
export function priyaHousehold(settings: Partial<HouseholdSettings> = {}) {
	vi.mocked(getOrganizationMembership).mockImplementation(async (organizationId, userId) => {
		const role = organizationId === "org-priya" ? PRIYA_ROLES[userId] : undefined;
		return (
			role
				? {
						id: `member-${userId}`,
						organizationId,
						userId,
						role,
						createdAt: FIXTURE_CREATED_AT,
						organization: { id: "org-priya", name: "Priya", slug: "priya-k3m" },
					}
				: undefined
		) as never;
	});
	vi.mocked(getPageByOrganizationId).mockImplementation(
		async (organizationId) => (organizationId === "org-priya" ? priyaPage : undefined) as never,
	);
	vi.mocked(getHouseholdSetting).mockImplementation(
		async (organizationId) =>
			(organizationId === "org-priya"
				? {
						...defaultHouseholdSettings("org-priya"),
						...settings,
						createdAt: FIXTURE_CREATED_AT,
						updatedAt: FIXTURE_CREATED_AT,
					}
				: undefined) as never,
	);
}
