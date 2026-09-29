import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { insert } = vi.hoisted(() => ({ insert: vi.fn() }));

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@repo/database", async () => ({
	...(await vi.importActual<object>("@repo/database/drizzle/domain")),
	...(await vi.importActual<object>("@repo/database/drizzle/schema")),
	db: { insert },
	getOrganizationMembership: vi.fn(),
	getPageByOrganizationId: vi.fn(),
	getHouseholdSetting: vi.fn(),
	getPageByHandle: vi.fn(),
	getLetterById: vi.fn(),
	countActiveFamilyLinks: vi.fn(),
}));

vi.mock("@repo/i18n", () => ({
	getMessagesForLocale: vi.fn(),
	resolveLocale: () => "en",
}));

vi.mock("@repo/utils", () => ({ getBaseUrl: () => "https://rishta.example" }));

vi.mock("@repo/storage", () => ({ getSignedUrl: vi.fn() }));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { getLetterById, getPageByHandle } from "@repo/database";

import {
	priyaHousehold,
	procedureContext as context,
	signedInAs,
} from "../../../lib/test-household";
import { createFamilyLink } from "./create-link";

const input = {
	organizationId: "org-priya",
	handle: "7kq2m9",
	recipientLabel: "Nani",
	language: "hi" as const,
	expiresInDays: 3 as const,
	letterId: "letter-arjun",
};

beforeEach(() => {
	vi.clearAllMocks();
	priyaHousehold({ familySeesIntroductions: true });
});

describe("createFamilyLink", () => {
	it("never lets a guardian put a letter's note on a family link", async () => {
		signedInAs("user-sunita");

		await expect(call(createFamilyLink, input, { context })).rejects.toMatchObject({
			code: "FORBIDDEN",
			data: { code: "CANDIDATE_ONLY" },
		});
		expect(getPageByHandle).not.toHaveBeenCalled();
		expect(getLetterById).not.toHaveBeenCalled();
		expect(insert).not.toHaveBeenCalled();
	});

	it("still refuses family members any link", async () => {
		signedInAs("user-kabir");
		const { letterId: _letterId, ...pageOnly } = input;

		await expect(call(createFamilyLink, pageOnly, { context })).rejects.toMatchObject({
			code: "FORBIDDEN",
			data: { code: "ROLE_NOT_ALLOWED" },
		});
	});
});
