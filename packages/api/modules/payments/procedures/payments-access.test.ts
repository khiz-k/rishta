import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@repo/database", () => ({
	getOrganizationMembership: vi.fn(),
	getOrganizationById: vi.fn(),
	getPurchaseById: vi.fn(),
	getPurchasesByOrganizationId: vi.fn(),
	getPurchasesByUserId: vi.fn(),
}));

vi.mock("@repo/payments", () => ({
	createCheckoutLink: vi.fn(),
	createCustomerPortalLink: vi.fn(),
	findPriceByPlanId: vi.fn(),
	getCustomerIdFromEntity: vi.fn(),
	getPlanIdByProviderPriceId: vi.fn(() => "premium"),
	getPlanPriceByProviderPriceId: vi.fn(() => null),
	getProviderPriceIdByPlanId: vi.fn(),
}));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@repo/i18n", () => ({
	config: { localeCookieName: "NEXT_LOCALE" },
	resolveLocale: () => "en",
}));

import { auth } from "@repo/auth";
import {
	getOrganizationById,
	getOrganizationMembership,
	getPurchaseById,
	getPurchasesByOrganizationId,
	getPurchasesByUserId,
} from "@repo/database";
import {
	createCheckoutLink as createProviderCheckoutLink,
	createCustomerPortalLink as createProviderPortalLink,
	findPriceByPlanId,
	getProviderPriceIdByPlanId,
} from "@repo/payments";

import { createCheckoutLink } from "./create-checkout-link";
import { createCustomerPortalLink } from "./create-customer-portal-link";
import { listPurchases } from "./list-purchases";

const context = { headers: new Headers() };

function signedInAs(userId: string) {
	vi.mocked(auth.api.getSession).mockResolvedValue({
		user: { id: userId, email: `${userId}@example.com`, name: userId, role: "user" },
		session: { id: `session-${userId}`, userId },
	} as never);
}

/** Priya's household: `role` is the signed-in person's role in it, or null for a stranger. */
function memberAs(role: "owner" | "admin" | "member" | null) {
	vi.mocked(getOrganizationMembership).mockResolvedValue(
		role
			? ({
					organization: { id: "org-priya", name: "Priya", slug: "priya-k3m" },
					role,
				} as never)
			: undefined,
	);
}

const householdPurchase = {
	id: "purchase-1",
	organizationId: "org-priya",
	userId: null,
	type: "SUBSCRIPTION" as const,
	customerId: "cus_priya",
	subscriptionId: "sub_priya",
	priceId: "price_premium_month",
	status: "active",
	createdAt: new Date("2026-09-01T12:00:00Z"),
	updatedAt: null,
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("listPurchases", () => {
	it("refuses a stranger and never reads the household's purchases", async () => {
		signedInAs("user-karan");
		memberAs(null);

		await expect(
			call(listPurchases, { organizationId: "org-priya" }, { context }),
		).rejects.toMatchObject({ code: "FORBIDDEN", data: { code: "NOT_A_MEMBER" } });
		expect(getOrganizationMembership).toHaveBeenCalledWith("org-priya", "user-karan");
		expect(getPurchasesByOrganizationId).not.toHaveBeenCalled();
	});

	it("gives the candidate the household's purchases with their billing ids", async () => {
		signedInAs("user-priya");
		memberAs("owner");
		vi.mocked(getPurchasesByOrganizationId).mockResolvedValue([householdPurchase]);

		const [purchase] = await call(listPurchases, { organizationId: "org-priya" }, { context });

		expect(purchase).toMatchObject({
			customerId: "cus_priya",
			subscriptionId: "sub_priya",
			planId: "premium",
		});
	});

	it("tells family which plan the household is on, but not its billing ids", async () => {
		signedInAs("user-kabir");
		memberAs("member");
		vi.mocked(getPurchasesByOrganizationId).mockResolvedValue([householdPurchase]);

		const [purchase] = await call(listPurchases, { organizationId: "org-priya" }, { context });

		expect(purchase).toMatchObject({ planId: "premium", status: "active" });
		expect(purchase?.customerId).toBe("");
		expect(purchase?.subscriptionId).toBeNull();
	});

	it("lists only the signed-in person's own purchases without a household", async () => {
		signedInAs("user-priya");
		vi.mocked(getPurchasesByUserId).mockResolvedValue([]);

		await call(listPurchases, {}, { context });

		expect(getPurchasesByUserId).toHaveBeenCalledWith("user-priya");
		expect(getOrganizationMembership).not.toHaveBeenCalled();
	});
});

describe("createCustomerPortalLink", () => {
	beforeEach(() => {
		vi.mocked(createProviderPortalLink).mockResolvedValue("https://billing.example/portal");
	});

	it("opens a household's billing for a guardian", async () => {
		signedInAs("user-sunita");
		memberAs("admin");
		vi.mocked(getPurchaseById).mockResolvedValue(householdPurchase);

		await expect(
			call(createCustomerPortalLink, { purchaseId: "purchase-1" }, { context }),
		).resolves.toEqual({ customerPortalLink: "https://billing.example/portal" });
	});

	it("refuses family members and strangers before reaching the provider", async () => {
		vi.mocked(getPurchaseById).mockResolvedValue(householdPurchase);

		signedInAs("user-kabir");
		memberAs("member");
		await expect(
			call(createCustomerPortalLink, { purchaseId: "purchase-1" }, { context }),
		).rejects.toMatchObject({ code: "FORBIDDEN", data: { code: "ROLE_NOT_ALLOWED" } });

		signedInAs("user-karan");
		memberAs(null);
		await expect(
			call(createCustomerPortalLink, { purchaseId: "purchase-1" }, { context }),
		).rejects.toMatchObject({ code: "FORBIDDEN", data: { code: "NOT_A_MEMBER" } });

		expect(createProviderPortalLink).not.toHaveBeenCalled();
	});

	it("answers a missing purchase exactly like another household's", async () => {
		signedInAs("user-karan");
		memberAs(null);
		const notYours = { code: "FORBIDDEN", data: { code: "NOT_A_MEMBER" } };

		vi.mocked(getPurchaseById).mockResolvedValue(undefined);
		await expect(
			call(createCustomerPortalLink, { purchaseId: "purchase-404" }, { context }),
		).rejects.toMatchObject(notYours);

		vi.mocked(getPurchaseById).mockResolvedValue(householdPurchase);
		await expect(
			call(createCustomerPortalLink, { purchaseId: "purchase-1" }, { context }),
		).rejects.toMatchObject(notYours);

		expect(createProviderPortalLink).not.toHaveBeenCalled();
	});

	it("opens a personal purchase for its buyer only, and never an ownerless one", async () => {
		const personal = { ...householdPurchase, organizationId: null, userId: "user-priya" };
		const notYours = { code: "FORBIDDEN", data: { code: "NOT_A_MEMBER" } };

		signedInAs("user-karan");
		vi.mocked(getPurchaseById).mockResolvedValue(personal);
		await expect(
			call(createCustomerPortalLink, { purchaseId: "purchase-1" }, { context }),
		).rejects.toMatchObject(notYours);

		vi.mocked(getPurchaseById).mockResolvedValue({ ...personal, userId: null });
		await expect(
			call(createCustomerPortalLink, { purchaseId: "purchase-1" }, { context }),
		).rejects.toMatchObject(notYours);

		signedInAs("user-priya");
		vi.mocked(getPurchaseById).mockResolvedValue(personal);
		await expect(
			call(createCustomerPortalLink, { purchaseId: "purchase-1" }, { context }),
		).resolves.toEqual({ customerPortalLink: "https://billing.example/portal" });

		expect(getOrganizationMembership).not.toHaveBeenCalled();
	});
});

describe("createCheckoutLink", () => {
	const input = {
		planId: "premium",
		type: "subscription" as const,
		interval: "month" as const,
		organizationId: "org-priya",
	};

	it("refuses family members and strangers before pricing or checkout", async () => {
		signedInAs("user-kabir");
		memberAs("member");
		await expect(call(createCheckoutLink, input, { context })).rejects.toMatchObject({
			code: "FORBIDDEN",
			data: { code: "ROLE_NOT_ALLOWED" },
		});

		signedInAs("user-karan");
		memberAs(null);
		await expect(call(createCheckoutLink, input, { context })).rejects.toMatchObject({
			code: "FORBIDDEN",
			data: { code: "NOT_A_MEMBER" },
		});

		expect(findPriceByPlanId).not.toHaveBeenCalled();
		expect(createProviderCheckoutLink).not.toHaveBeenCalled();
	});

	it("lets the candidate or a guardian check out for the household", async () => {
		vi.mocked(findPriceByPlanId).mockReturnValue({
			type: "subscription",
			interval: "month",
			amount: 19,
			currency: "USD",
		} as never);
		vi.mocked(getProviderPriceIdByPlanId).mockReturnValue("price_premium_month");
		vi.mocked(getOrganizationById).mockResolvedValue({ id: "org-priya", members: [] } as never);
		vi.mocked(createProviderCheckoutLink).mockResolvedValue("https://billing.example/checkout");

		for (const role of ["owner", "admin"] as const) {
			signedInAs(role === "owner" ? "user-priya" : "user-sunita");
			memberAs(role);
			await expect(call(createCheckoutLink, input, { context })).resolves.toEqual({
				checkoutLink: "https://billing.example/checkout",
			});
		}
		expect(createProviderCheckoutLink).toHaveBeenLastCalledWith(
			expect.objectContaining({
				organizationId: "org-priya",
				priceId: "price_premium_month",
			}),
		);
	});
});
