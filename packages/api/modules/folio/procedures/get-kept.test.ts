import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Standalone so the assertions never reference a method off the mocked client.
const { findUsers } = vi.hoisted(() => ({ findUsers: vi.fn() }));

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@repo/database", async () => ({
	...(await vi.importActual<object>("@repo/database/drizzle/domain")),
	...(await vi.importActual<object>("@repo/database/drizzle/schema")),
	...(await vi.importActual<object>("@repo/database/drizzle/zod")),
	db: { query: { user: { findMany: findUsers } } },
	getOrganizationMembership: vi.fn(),
	getPageByOrganizationId: vi.fn(),
	getHouseholdSetting: vi.fn(),
	getBlockedUserIdsEitherWay: vi.fn(),
	getKeptPages: vi.fn(),
	getLettersByPartner: vi.fn(),
	getMarginNotes: vi.fn(),
	getPagesByUserIds: vi.fn(),
	getPreferencesByOrganizationIds: vi.fn(),
	getPreferenceByOrganizationId: vi.fn(),
}));

vi.mock("@repo/storage", () => ({ getSignedUrl: vi.fn() }));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import {
	getBlockedUserIdsEitherWay,
	getKeptPages,
	getLettersByPartner,
	getMarginNotes,
	getPagesByUserIds,
	getPreferenceByOrganizationId,
	getPreferencesByOrganizationIds,
} from "@repo/database";

import {
	FIXTURE_CREATED_AT,
	letterRow,
	marginNoteRow,
	matchRow,
	pageRow,
} from "../../../lib/test-fixtures";
import {
	priyaHousehold,
	procedureContext as context,
	signedInAs,
} from "../../../lib/test-household";
import { getKept } from "./get-kept";

const arjunPage = {
	...pageRow({
		id: "page-arjun",
		organizationId: "org-arjun",
		userId: "user-arjun",
		handle: "7kq2m9",
		displayName: "Arjun",
		fullName: "Arjun Mehta",
		gender: "male",
	}),
	photos: [],
};

const priyasLetter = {
	...letterRow({
		id: "letter-priya",
		fromUserId: "user-priya",
		toUserId: "user-arjun",
		fromOrganizationId: "org-priya",
		toOrganizationId: "org-arjun",
		status: "accepted",
	}),
	match: matchRow({ interestId: "letter-priya" }),
};

const input = { organizationId: "org-priya" };

beforeEach(() => {
	vi.clearAllMocks();
	priyaHousehold();
	vi.mocked(getKeptPages).mockResolvedValue([
		{
			id: "kept-1",
			organizationId: "org-priya",
			userId: "user-priya",
			profileUserId: "user-arjun",
			keptByUserId: "user-sunita",
			createdAt: FIXTURE_CREATED_AT,
		},
	]);
	vi.mocked(getPagesByUserIds).mockResolvedValue([arjunPage] as never);
	vi.mocked(getBlockedUserIdsEitherWay).mockResolvedValue(new Set());
	vi.mocked(getPreferenceByOrganizationId).mockResolvedValue(undefined);
	vi.mocked(getPreferencesByOrganizationIds).mockResolvedValue([]);
	findUsers.mockResolvedValue([{ id: "user-sunita", name: "Sunita Sharma" }] as never);
	vi.mocked(getLettersByPartner).mockResolvedValue(new Map([["user-arjun", [priyasLetter]]]));
	vi.mocked(getMarginNotes).mockResolvedValue([
		marginNoteRow({ id: "note-priya", authorUserId: "user-priya", authorLabel: "Priya" }),
		marginNoteRow({ id: "note-ammi" }),
	]);
});

describe("getKept", () => {
	it("shows the candidate her introduction and her letter beside a kept page", async () => {
		signedInAs("user-priya");

		const [kept] = await call(getKept, input, { context });

		expect(kept?.page.relationship).toBe("introduced");
		expect(kept?.myLetter).toMatchObject({ letterId: "letter-priya" });
		expect(kept?.pencilNotes.map((note) => note.id)).toEqual(["note-priya", "note-ammi"]);
	});

	it("gives the guardian who kept it the stranger's view, no letter and not the candidate's notes", async () => {
		signedInAs("user-sunita");

		const [kept] = await call(getKept, input, { context });

		expect(kept?.keptBy).toBe("Sunita");
		expect(kept?.page.relationship).toBe("stranger");
		expect(kept?.page.sealed).toEqual({ open: false });
		expect(JSON.stringify(kept)).not.toContain("Arjun Mehta");
		expect(kept?.myLetter).toBeNull();
		expect(kept?.pencilNotes.map((note) => note.id)).toEqual(["note-ammi"]);
		expect(getLettersByPartner).not.toHaveBeenCalled();
	});

	it("refuses family when the candidate keeps the folio to herself", async () => {
		priyaHousehold({ familyReadsFolio: false });
		signedInAs("user-kabir");

		await expect(call(getKept, input, { context })).rejects.toMatchObject({
			code: "FORBIDDEN",
			data: { code: "ROLE_NOT_ALLOWED" },
		});
		expect(getKeptPages).not.toHaveBeenCalled();
	});
});
