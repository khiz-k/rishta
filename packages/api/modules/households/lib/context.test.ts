import { ORPCError } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", () => ({
	getOrganizationMembership: vi.fn(),
	getPageByOrganizationId: vi.fn(),
	getHouseholdSetting: vi.fn(),
}));

import {
	getHouseholdSetting,
	getOrganizationMembership,
	getPageByOrganizationId,
} from "@repo/database";

import { FIXTURE_CREATED_AT, pageRow } from "../../../lib/test-fixtures";
import {
	canEditPage,
	canReadFolio,
	defaultHouseholdSettings,
	getHouseholdContext,
	isCandidateReader,
	isPageClaimed,
	letterReaderUserId,
	memberLabelFor,
	requireCandidate,
	requireHousehold,
	type HouseholdContext,
	type HouseholdRole,
} from "./context";

const claimedPage = { ...pageRow(), photos: [] };
const draftedPage = {
	...pageRow({ userId: null, status: "awaiting_claim", claimedAt: null }),
	photos: [],
};

function household(
	role: HouseholdRole,
	overrides: Partial<HouseholdContext> = {},
): HouseholdContext {
	return {
		organizationId: "org-priya",
		organizationName: "Priya",
		slug: "priya-k3m",
		userId: role === "owner" ? "user-priya" : "user-sunita",
		role,
		isCandidate: role === "owner",
		page: claimedPage,
		settings: defaultHouseholdSettings("org-priya"),
		...overrides,
	};
}

function membership(role: string): Awaited<ReturnType<typeof getOrganizationMembership>> {
	return {
		id: `member-${role}`,
		organizationId: "org-priya",
		userId: `user-${role}`,
		role,
		createdAt: FIXTURE_CREATED_AT,
		organization: {
			id: "org-priya",
			name: "Priya",
			slug: "priya-k3m",
			logo: null,
			createdAt: FIXTURE_CREATED_AT,
			metadata: null,
			paymentsCustomerId: null,
		},
	};
}

describe("canEditPage", () => {
	it("lets the candidate edit, and a guardian only when allowed or before the claim", () => {
		expect(canEditPage(household("owner"))).toBe(true);
		expect(canEditPage(household("admin"))).toBe(false);
		expect(
			canEditPage(
				household("admin", {
					settings: { ...defaultHouseholdSettings("org-priya"), familyEditsPage: true },
				}),
			),
		).toBe(true);
		expect(canEditPage(household("admin", { page: draftedPage }))).toBe(true);
	});

	it("never lets family members edit", () => {
		expect(canEditPage(household("member", { page: draftedPage }))).toBe(false);
		expect(
			canEditPage(
				household("member", {
					settings: { ...defaultHouseholdSettings("org-priya"), familyEditsPage: true },
				}),
			),
		).toBe(false);
	});
});

describe("canReadFolio", () => {
	it("lets family read the folio only if the candidate allows it", () => {
		const closed = { ...defaultHouseholdSettings("org-priya"), familyReadsFolio: false };

		expect(canReadFolio(household("owner", { settings: closed }))).toBe(true);
		expect(canReadFolio(household("admin", { settings: closed }))).toBe(false);
		expect(canReadFolio(household("member", { settings: closed }))).toBe(false);
		expect(canReadFolio(household("member"))).toBe(true);
	});
});

describe("letterReaderUserId", () => {
	it("reads letters beside a page for the candidate only", () => {
		expect(isCandidateReader(household("owner"))).toBe(true);
		expect(letterReaderUserId(household("owner"))).toBe("user-priya");
		expect(letterReaderUserId(household("admin"))).toBeNull();
		expect(letterReaderUserId(household("member"))).toBeNull();
	});

	it("keeps them from family even when introductions are shared as stage lines", () => {
		const shared = { ...defaultHouseholdSettings("org-priya"), familySeesIntroductions: true };
		expect(letterReaderUserId(household("member", { settings: shared }))).toBeNull();
	});

	it("has no letters to read for the drafter who owns a page awaiting its candidate", () => {
		const drafter = household("owner", {
			userId: "user-nasreen",
			isCandidate: false,
			page: draftedPage,
		});
		expect(isCandidateReader(drafter)).toBe(false);
		expect(letterReaderUserId(drafter)).toBeNull();
	});
});

describe("isPageClaimed", () => {
	it("is false for a drafted page awaiting its candidate", () => {
		expect(isPageClaimed(claimedPage)).toBe(true);
		expect(isPageClaimed(draftedPage)).toBe(false);
		expect(isPageClaimed(null)).toBe(false);
	});
});

describe("memberLabelFor", () => {
	it("signs with the household's name for a member, else their first name", () => {
		const settings = {
			...defaultHouseholdSettings("org-priya"),
			memberLabels: { "user-sunita": "Ammi", "user-kabir": "  " },
		};

		expect(memberLabelFor(settings, "user-sunita", "Sunita Sharma")).toBe("Ammi");
		expect(memberLabelFor(settings, "user-kabir", "Kabir Sharma")).toBe("Kabir");
	});
});

describe("getHouseholdContext", () => {
	beforeEach(() => {
		vi.mocked(getOrganizationMembership).mockReset();
		vi.mocked(getPageByOrganizationId).mockResolvedValue(claimedPage);
		vi.mocked(getHouseholdSetting).mockResolvedValue(undefined);
	});

	it("refuses anyone who is not a member of the household", async () => {
		vi.mocked(getOrganizationMembership).mockResolvedValueOnce(undefined);

		const attempt = getHouseholdContext("org-priya", "user-karan");

		await expect(attempt).rejects.toBeInstanceOf(ORPCError);
		await expect(attempt).rejects.toMatchObject({
			code: "FORBIDDEN",
			data: { code: "NOT_A_MEMBER" },
		});
	});

	it("knows the candidate by the page, not by the role", async () => {
		vi.mocked(getOrganizationMembership).mockResolvedValueOnce(membership("owner"));

		const context = await getHouseholdContext("org-priya", "user-priya");

		expect(context.role).toBe("owner");
		expect(context.isCandidate).toBe(true);
		expect(context.settings.familyReadsFolio).toBe(true);
	});

	it("maps unknown roles to family", async () => {
		vi.mocked(getOrganizationMembership).mockResolvedValueOnce(membership("viewer"));

		expect((await getHouseholdContext("org-priya", "user-kabir")).role).toBe("member");
	});
});

describe("requireCandidate", () => {
	beforeEach(() => {
		vi.mocked(getPageByOrganizationId).mockResolvedValue(claimedPage);
		vi.mocked(getHouseholdSetting).mockResolvedValue(undefined);
	});

	it("lets only the claimed page's own candidate seal, answer or close", async () => {
		vi.mocked(getOrganizationMembership).mockResolvedValueOnce(membership("owner"));
		await expect(requireCandidate("org-priya", "user-priya")).resolves.toMatchObject({
			isCandidate: true,
		});

		vi.mocked(getOrganizationMembership).mockResolvedValueOnce(membership("admin"));
		await expect(requireCandidate("org-priya", "user-sunita")).rejects.toMatchObject({
			data: { code: "CANDIDATE_ONLY" },
		});
	});

	it("refuses the drafter who still owns a page awaiting its candidate", async () => {
		vi.mocked(getPageByOrganizationId).mockResolvedValueOnce(draftedPage);
		vi.mocked(getOrganizationMembership).mockResolvedValueOnce(membership("owner"));

		await expect(requireCandidate("org-ali", "user-nasreen")).rejects.toMatchObject({
			data: { code: "CANDIDATE_ONLY" },
		});
	});
});

describe("requireHousehold", () => {
	it("checks the role after the membership", async () => {
		vi.mocked(getPageByOrganizationId).mockResolvedValue(claimedPage);
		vi.mocked(getHouseholdSetting).mockResolvedValue(undefined);
		vi.mocked(getOrganizationMembership).mockResolvedValueOnce(membership("member"));

		await expect(
			requireHousehold("org-priya", "user-kabir", ["owner", "admin"]),
		).rejects.toMatchObject({ data: { code: "ROLE_NOT_ALLOWED" } });
	});
});
