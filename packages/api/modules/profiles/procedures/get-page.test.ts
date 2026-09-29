import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@repo/database", async () => ({
	...(await vi.importActual<object>("@repo/database/drizzle/domain")),
	...(await vi.importActual<object>("@repo/database/drizzle/zod")),
	getOrganizationMembership: vi.fn(),
	getPageByOrganizationId: vi.fn(),
	getHouseholdSetting: vi.fn(),
	getPageByHandle: vi.fn(),
	isBlockedEitherWay: vi.fn(),
	getLettersBetweenUsers: vi.fn(),
	getPreferenceByOrganizationId: vi.fn(),
	getKeptProfileUserIds: vi.fn(),
	getMarginNotes: vi.fn(),
}));

vi.mock("@repo/storage", () => ({ getSignedUrl: vi.fn() }));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import {
	getLettersBetweenUsers,
	getMarginNotes,
	getPageByHandle,
	getPreferenceByOrganizationId,
	getKeptProfileUserIds,
	isBlockedEitherWay,
} from "@repo/database";

import { letterRow, marginNoteRow, matchRow, pageRow, photoRow } from "../../../lib/test-fixtures";
import {
	priyaHousehold,
	priyaPage,
	procedureContext as context,
	signedInAs,
} from "../../../lib/test-household";
import { getPage } from "./get-page";

/** Arjun's page, in another household. He wrote to Priya and she said yes: an introduction. */
const arjunPage = {
	...pageRow({
		id: "page-arjun",
		organizationId: "org-arjun",
		userId: "user-arjun",
		handle: "7kq2m9",
		displayName: "Arjun",
		fullName: "Arjun Mehta",
		gender: "male",
		employer: "Sunnybrook Hospital",
		contactPhone: "+14165550123",
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

const match = matchRow({ phoneSharedByA: true });
const arjunsLetter = { ...letterRow({ status: "accepted" }), match };

const notes = [
	marginNoteRow({ id: "note-priya", authorUserId: "user-priya", authorLabel: "Priya" }),
	marginNoteRow({ id: "note-ammi" }),
	marginNoteRow({
		id: "note-nani",
		authorUserId: null,
		familyLinkId: "link-1",
		authorLabel: "Nani",
	}),
];

beforeEach(() => {
	vi.clearAllMocks();
	priyaHousehold();
	vi.mocked(getPageByHandle).mockImplementation(
		async (handle) =>
			(handle === "7kq2m9"
				? arjunPage
				: handle === "prs482"
					? priyaPage
					: undefined) as never,
	);
	vi.mocked(isBlockedEitherWay).mockResolvedValue(false);
	vi.mocked(getLettersBetweenUsers).mockResolvedValue([arjunsLetter]);
	vi.mocked(getPreferenceByOrganizationId).mockResolvedValue(undefined);
	vi.mocked(getKeptProfileUserIds).mockResolvedValue(new Set(["user-arjun"]));
	vi.mocked(getMarginNotes).mockResolvedValue(notes);
});

const input = { organizationId: "org-priya", handle: "7kq2m9" };

describe("getPage", () => {
	it("opens the introduction to the candidate: seal, clear photos, phone and her letter", async () => {
		signedInAs("user-priya");

		const page = await call(getPage, input, { context });

		expect(page.relationship).toBe("introduced");
		expect(page.sealed).toMatchObject({ open: true });
		expect(JSON.stringify(page.sealed)).toContain("Arjun Mehta");
		expect(JSON.stringify(page.sealed)).toContain("+14165550123");
		expect(page.photos[0]).toMatchObject({ veiled: false });
		expect(page.theirLetter).toMatchObject({ letterId: "letter-arjun", state: "introduced" });
		expect(page.pencilNotes.map((note) => note.id)).toEqual([
			"note-priya",
			"note-ammi",
			"note-nani",
		]);
	});

	it("gives a guardian the stranger's view: no seal, no clear photo, no letters", async () => {
		signedInAs("user-sunita");

		const page = await call(getPage, input, { context });

		expect(page.relationship).toBe("stranger");
		expect(page.sealed).toEqual({ open: false });
		expect(JSON.stringify(page)).not.toContain("Arjun Mehta");
		expect(JSON.stringify(page)).not.toContain("Sunnybrook");
		expect(JSON.stringify(page)).not.toContain("+14165550123");
		expect(page.photos[0]).toMatchObject({
			veiled: true,
			url: "https://img.example/arjun-veil.jpg",
		});
		expect(page.myLetter).toBeNull();
		expect(page.theirLetter).toBeNull();
		// The candidate's letters are never even read for someone else in the household.
		expect(getLettersBetweenUsers).not.toHaveBeenCalled();
		// The household's kept mark and pencil notes stay theirs to share.
		expect(page.kept).toBe(true);
	});

	it("keeps letters from family even when the candidate shares introduction stage lines", async () => {
		signedInAs("user-kabir");
		priyaHousehold({ familySeesIntroductions: true });

		const page = await call(getPage, input, { context });

		expect(page.relationship).toBe("stranger");
		expect(page.sealed).toEqual({ open: false });
		expect(page.myLetter).toBeNull();
		expect(page.theirLetter).toBeNull();
	});

	it("keeps the candidate's own pencil notes to the candidate", async () => {
		signedInAs("user-sunita");

		const page = await call(getPage, input, { context });

		expect(page.pencilNotes.map((note) => note.id)).toEqual(["note-ammi", "note-nani"]);
		expect(page.pencilNotes.find((note) => note.id === "note-ammi")?.isMine).toBe(true);
	});

	it("refuses guardians and family another household's page when the folio is closed to them", async () => {
		priyaHousehold({ familyReadsFolio: false });

		for (const userId of ["user-sunita", "user-kabir"]) {
			signedInAs(userId);
			await expect(call(getPage, input, { context })).rejects.toMatchObject({
				code: "FORBIDDEN",
				data: { code: "ROLE_NOT_ALLOWED" },
			});
		}
		expect(getMarginNotes).not.toHaveBeenCalled();

		signedInAs("user-priya");
		await expect(call(getPage, input, { context })).resolves.toMatchObject({
			relationship: "introduced",
		});
	});

	it("still shows family the household's own page when the folio is closed to them", async () => {
		priyaHousehold({ familyReadsFolio: false });
		signedInAs("user-kabir");

		const page = await call(getPage, { ...input, handle: "prs482" }, { context });

		expect(page.relationship).toBe("household");
	});

	it("refuses anyone outside the household before reading the page", async () => {
		signedInAs("user-karan");

		await expect(call(getPage, input, { context })).rejects.toMatchObject({
			code: "FORBIDDEN",
			data: { code: "NOT_A_MEMBER" },
		});
		expect(getPageByHandle).not.toHaveBeenCalled();
	});
});
