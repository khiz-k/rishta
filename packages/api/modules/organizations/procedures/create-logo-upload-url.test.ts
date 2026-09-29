import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@repo/database", () => ({
	getOrganizationMembership: vi.fn(),
	getOrganizationById: vi.fn(),
}));

vi.mock("@repo/storage", () => ({
	getSignedUploadUrl: vi.fn(async () => "https://storage.example/upload"),
}));

import { auth } from "@repo/auth";
import { getOrganizationById, getOrganizationMembership } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";

import { createLogoUploadUrl } from "./create-logo-upload-url";

const context = { headers: new Headers() };

function as(role: string | null) {
	vi.mocked(auth.api.getSession).mockResolvedValue({
		user: { id: "user-1", role: "user" },
		session: { id: "session-1", userId: "user-1" },
	} as never);
	vi.mocked(getOrganizationMembership).mockResolvedValue(
		role
			? ({
					organization: { id: "org-priya", name: "Priya", slug: "priya-k3m" },
					role,
				} as never)
			: undefined,
	);
}

describe("createLogoUploadUrl", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getOrganizationById).mockResolvedValue({ id: "org-priya" } as never);
	});

	it("checks membership before revealing whether the household exists", async () => {
		as(null);
		vi.mocked(getOrganizationById).mockResolvedValue(null as never);

		await expect(
			call(createLogoUploadUrl, { organizationId: "org-unknown" }, { context }),
		).rejects.toMatchObject({ code: "FORBIDDEN", data: { code: "NOT_A_MEMBER" } });
		expect(getOrganizationById).not.toHaveBeenCalled();
	});

	it("lets only the owner change the household's logo", async () => {
		for (const role of ["admin", "member"]) {
			as(role);
			await expect(
				call(createLogoUploadUrl, { organizationId: "org-priya" }, { context }),
			).rejects.toMatchObject({ data: { code: "ROLE_NOT_ALLOWED" } });
		}
		expect(getSignedUploadUrl).not.toHaveBeenCalled();

		as("owner");
		await expect(
			call(createLogoUploadUrl, { organizationId: "org-priya" }, { context }),
		).resolves.toEqual({
			signedUploadUrl: "https://storage.example/upload",
			path: "org-priya.png",
		});
	});
});
