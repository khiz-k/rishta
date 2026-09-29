import type { FolioPageRow } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", () => ({
	getBlockedUserIdsEitherWay: vi.fn(),
	getKeptProfileUserIds: vi.fn(),
	getLettersByPartner: vi.fn(),
	getMarginNotes: vi.fn(),
	getPagesByIds: vi.fn(),
}));

vi.mock("@repo/storage", () => ({ getSignedUrl: vi.fn() }));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import {
	getBlockedUserIdsEitherWay,
	getKeptProfileUserIds,
	getLettersByPartner,
	getMarginNotes,
	getPagesByIds,
} from "@repo/database";

import {
	FIXTURE_CREATED_AT,
	letterRow,
	marginNoteRow,
	matchRow,
	pageRow,
	photoRow,
} from "../../../lib/test-fixtures";
import {
	defaultHouseholdSettings,
	type HouseholdContext,
	type HouseholdRole,
} from "../../households/lib/context";
import { presentFolioPages } from "./present";

const priyaPage = { ...pageRow(), photos: [] };

function readerIn(role: HouseholdRole, userId: string): HouseholdContext {
	return {
		organizationId: "org-priya",
		organizationName: "Priya",
		slug: "priya-k3m",
		userId,
		role,
		isCandidate: userId === "user-priya",
		page: priyaPage,
		settings: { ...defaultHouseholdSettings("org-priya"), familySeesIntroductions: true },
	};
}

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
	photos: [
		photoRow("after_note", {
			profileId: "page-arjun",
			organizationId: "org-arjun",
			storageKey: "external:https://img.example/arjun-clear.jpg",
			veilKey: "external:https://img.example/arjun-veil.jpg",
		}),
	],
};

const row: FolioPageRow = {
	id: "folio-page-1",
	folioId: "folio-1",
	organizationId: "org-priya",
	profileId: "page-arjun",
	position: 1,
	reasons: [],
	score: 0,
	state: "read",
	passReason: null,
	seenBefore: false,
	answeredAt: null,
	createdAt: FIXTURE_CREATED_AT,
};

// Priya wrote to Arjun and he said yes: an introduction, with her letter.
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

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(getPagesByIds).mockResolvedValue([arjunPage] as never);
	vi.mocked(getBlockedUserIdsEitherWay).mockResolvedValue(new Set());
	vi.mocked(getKeptProfileUserIds).mockResolvedValue(new Set());
	vi.mocked(getLettersByPartner).mockResolvedValue(new Map([["user-arjun", [priyasLetter]]]));
	vi.mocked(getMarginNotes).mockResolvedValue([
		marginNoteRow({ id: "note-priya", authorUserId: "user-priya", authorLabel: "Priya" }),
		marginNoteRow({ id: "note-ammi" }),
	]);
});

describe("presentFolioPages", () => {
	it("shows the candidate her introduction, her letter and all her notes", async () => {
		const [page] = await presentFolioPages(readerIn("owner", "user-priya"), [row]);

		expect(page?.page?.relationship).toBe("introduced");
		expect(page?.page?.sealed).toMatchObject({ open: true });
		expect(page?.myLetter).toMatchObject({ letterId: "letter-priya", state: "introduced" });
		expect(page?.pencilNotes.map((note) => note.id)).toEqual(["note-priya", "note-ammi"]);
		expect(getLettersByPartner).toHaveBeenCalledWith("user-priya", ["user-arjun"]);
	});

	it("gives a guardian and family the stranger's view, no letter and not her notes", async () => {
		for (const [role, userId] of [
			["admin", "user-sunita"],
			["member", "user-kabir"],
		] as const) {
			const [page] = await presentFolioPages(readerIn(role, userId), [row]);

			expect(page?.page?.relationship).toBe("stranger");
			expect(page?.page?.sealed).toEqual({ open: false });
			expect(page?.page?.photos[0]?.veiled).toBe(true);
			expect(JSON.stringify(page)).not.toContain("Arjun Mehta");
			expect(page?.myLetter).toBeNull();
			expect(page?.pencilNotes.map((note) => note.id)).toEqual(["note-ammi"]);
		}
		expect(getLettersByPartner).not.toHaveBeenCalled();
	});
});
