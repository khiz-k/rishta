import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Standalone so the assertions never reference a method off the mocked client.
const { transaction, remove } = vi.hoisted(() => ({ transaction: vi.fn(), remove: vi.fn() }));

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@repo/database", async () => ({
	...(await vi.importActual<object>("@repo/database/drizzle/domain")),
	...(await vi.importActual<object>("@repo/database/drizzle/schema")),
	db: { transaction, delete: remove },
	getOrganizationMembership: vi.fn(),
	getPageByOrganizationId: vi.fn(),
	getHouseholdSetting: vi.fn(),
	getHouseholdBySlug: vi.fn(),
	getHouseholdById: vi.fn(),
	getHouseholdSubscription: vi.fn(),
	countHouseholdMembers: vi.fn(),
	getPreferenceByOrganizationId: vi.fn(),
	getPageByUserId: vi.fn(),
}));

vi.mock("@repo/storage", () => ({ getSignedUrl: vi.fn() }));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("../../notifications/lib/notify", () => ({ notifyUser: vi.fn() }));

import {
	countHouseholdMembers,
	getHouseholdById,
	getHouseholdBySlug,
	getHouseholdSubscription,
	getPageByUserId,
	getPreferenceByOrganizationId,
} from "@repo/database";

import { FIXTURE_CREATED_AT, pageRow } from "../../../lib/test-fixtures";
import {
	priyaHousehold,
	procedureContext as context,
	signedInAs,
} from "../../../lib/test-household";
import { notifyUser } from "../../notifications/lib/notify";
import { defaultHouseholdSettings } from "../lib/context";
import { claimPage } from "./claim-page";
import { declineClaim } from "./decline-claim";
import { getClaim } from "./get-claim";
import { getHousehold } from "./get-household";

/** Ali's household: his mother Nasreen drafted his page and invited ali@example.com to claim it. */
function aliHousehold(
	overrides: {
		pageUserId?: string | null;
		pendingCandidateEmail?: string | null;
	} = {},
) {
	const organization = { id: "org-ali", name: "Ali", slug: "ali-7qm" };
	const biodataProfile = pageRow({
		id: "page-ali",
		organizationId: "org-ali",
		userId: overrides.pageUserId ?? null,
		handle: "a1q7m3",
		displayName: "Ali",
		fullName: "Ali Khan",
		gender: "male",
		status: overrides.pageUserId ? "draft" : "awaiting_claim",
		claimedAt: overrides.pageUserId ? FIXTURE_CREATED_AT : null,
		createdBy: "parent",
	});
	const householdSetting = {
		...defaultHouseholdSettings("org-ali"),
		candidateRelation: "son" as const,
		pendingCandidateEmail:
			overrides.pendingCandidateEmail === undefined
				? "ali@example.com"
				: overrides.pendingCandidateEmail,
		createdAt: FIXTURE_CREATED_AT,
		updatedAt: FIXTURE_CREATED_AT,
	};
	const household = {
		...organization,
		logo: null,
		metadata: null,
		paymentsCustomerId: null,
		createdAt: FIXTURE_CREATED_AT,
		householdSetting,
		biodataProfile,
		members: [
			{
				id: "member-nasreen",
				organizationId: "org-ali",
				userId: "user-nasreen",
				role: "owner",
				createdAt: FIXTURE_CREATED_AT,
				user: { id: "user-nasreen", name: "Nasreen Khan", email: "nasreen@example.com" },
			},
		],
	};
	vi.mocked(getHouseholdById).mockResolvedValue(household as never);
	vi.mocked(getHouseholdBySlug).mockResolvedValue(household as never);
}

beforeEach(() => {
	vi.clearAllMocks();
	priyaHousehold();
	vi.mocked(getPageByUserId).mockResolvedValue(undefined);
});

describe("getHousehold", () => {
	it("answers an unknown slug exactly as a household you are not in", async () => {
		signedInAs("user-karan");

		vi.mocked(getHouseholdBySlug).mockResolvedValueOnce(undefined);
		const unknown = await call(getHousehold, { organizationSlug: "nobody-x1y" }, { context })
			.then(() => null)
			.catch((error: unknown) => error);

		vi.mocked(getHouseholdBySlug).mockResolvedValueOnce({
			id: "org-priya",
			name: "Priya",
			slug: "priya-k3m",
		} as never);
		const notMine = await call(getHousehold, { organizationSlug: "priya-k3m" }, { context })
			.then(() => null)
			.catch((error: unknown) => error);

		expect(unknown).toMatchObject({ code: "FORBIDDEN", data: { code: "NOT_A_MEMBER" } });
		expect(notMine).toMatchObject({ code: "FORBIDDEN", data: { code: "NOT_A_MEMBER" } });
		expect(countHouseholdMembers).not.toHaveBeenCalled();
	});

	it("still opens the household to its members", async () => {
		signedInAs("user-kabir");
		vi.mocked(getHouseholdBySlug).mockResolvedValue({
			id: "org-priya",
			name: "Priya",
			slug: "priya-k3m",
		} as never);
		vi.mocked(getHouseholdSubscription).mockResolvedValue({ plan: "free", trialing: false });
		vi.mocked(countHouseholdMembers).mockResolvedValue(3);
		vi.mocked(getPreferenceByOrganizationId).mockResolvedValue(undefined);
		vi.mocked(getHouseholdById).mockResolvedValue({ members: [] } as never);

		const household = await call(getHousehold, { organizationSlug: "priya-k3m" }, { context });

		expect(household).toMatchObject({ id: "org-priya", role: "member", isCandidate: false });
	});
});

describe("loadClaimableHousehold", () => {
	const claimCalls = [
		["getClaim", () => call(getClaim, { organizationSlug: "ali-7qm" }, { context })],
		["claimPage", () => call(claimPage, { organizationId: "org-ali" }, { context })],
		["declineClaim", () => call(declineClaim, { organizationId: "org-ali" }, { context })],
	] as const;

	it("gives a stranger one answer whatever state the household is in", async () => {
		signedInAs("user-karan", { email: "karan@example.com" });
		const states = [
			() => {
				vi.mocked(getHouseholdById).mockResolvedValue(undefined);
				vi.mocked(getHouseholdBySlug).mockResolvedValue(undefined);
			},
			() => aliHousehold(),
			() => aliHousehold({ pageUserId: "user-ali", pendingCandidateEmail: null }),
			() => aliHousehold({ pendingCandidateEmail: null }),
		];

		for (const arrange of states) {
			arrange();
			for (const [, attempt] of claimCalls) {
				await expect(attempt()).rejects.toMatchObject({
					code: "FORBIDDEN",
					data: { code: "CLAIM_NOT_FOR_YOU" },
				});
			}
		}
		expect(transaction).not.toHaveBeenCalled();
		expect(remove).not.toHaveBeenCalled();
		expect(notifyUser).not.toHaveBeenCalled();
	});

	it("tells only the invitee to verify their email first", async () => {
		aliHousehold();
		signedInAs("user-ali", { email: "Ali@Example.com", emailVerified: false });

		for (const [, attempt] of claimCalls) {
			await expect(attempt()).rejects.toMatchObject({
				data: { code: "EMAIL_NOT_VERIFIED" },
			});
		}
	});

	it("tells the candidate reopening the link that the page is already theirs", async () => {
		aliHousehold({ pageUserId: "user-ali", pendingCandidateEmail: null });
		signedInAs("user-ali", { email: "ali@example.com" });

		await expect(
			call(getClaim, { organizationSlug: "ali-7qm" }, { context }),
		).rejects.toMatchObject({ code: "CONFLICT", data: { code: "ALREADY_CLAIMED" } });
	});

	it("shows the invited candidate the draft their family wrote", async () => {
		aliHousehold();
		signedInAs("user-ali", { email: "ali@example.com" });

		const claim = await call(getClaim, { organizationSlug: "ali-7qm" }, { context });

		expect(claim).toMatchObject({
			organizationId: "org-ali",
			candidateFirstName: "Ali",
			drafters: [{ name: "Nasreen Khan", label: null }],
		});
	});
});
