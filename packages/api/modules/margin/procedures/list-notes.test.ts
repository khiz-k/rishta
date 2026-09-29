import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@repo/database", async () => ({
	...(await vi.importActual<object>("@repo/database/drizzle/domain")),
	getOrganizationMembership: vi.fn(),
	getPageByOrganizationId: vi.fn(),
	getHouseholdSetting: vi.fn(),
	getPageByHandle: vi.fn(),
	isBlockedEitherWay: vi.fn(),
	getLettersBetweenUsers: vi.fn(),
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
	isBlockedEitherWay,
} from "@repo/database";

import { marginNoteRow, pageRow } from "../../../lib/test-fixtures";
import {
	priyaHousehold,
	priyaPage,
	procedureContext as context,
	signedInAs,
} from "../../../lib/test-household";
import { listMarginNotes } from "./list-notes";

const arjunPage = {
	...pageRow({
		id: "page-arjun",
		organizationId: "org-arjun",
		userId: "user-arjun",
		handle: "7kq2m9",
		displayName: "Arjun",
	}),
	photos: [],
};

const input = { organizationId: "org-priya", handle: "7kq2m9" };

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
	vi.mocked(getLettersBetweenUsers).mockResolvedValue([]);
	vi.mocked(getMarginNotes).mockResolvedValue([
		marginNoteRow({ id: "note-priya", authorUserId: "user-priya", authorLabel: "Priya" }),
		marginNoteRow({ id: "note-ammi" }),
	]);
});

describe("listMarginNotes", () => {
	it("gives the candidate every note, her own included", async () => {
		signedInAs("user-priya");

		const notes = await call(listMarginNotes, input, { context });

		expect(notes.map((note) => note.id)).toEqual(["note-priya", "note-ammi"]);
	});

	it("never sends the candidate's own notes to a guardian or family", async () => {
		for (const userId of ["user-sunita", "user-kabir"]) {
			signedInAs(userId);
			const notes = await call(listMarginNotes, input, { context });
			expect(notes.map((note) => note.id)).toEqual(["note-ammi"]);
		}
	});

	it("refuses guardians and family when the candidate keeps the folio to herself", async () => {
		priyaHousehold({ familyReadsFolio: false });
		signedInAs("user-kabir");

		await expect(call(listMarginNotes, input, { context })).rejects.toMatchObject({
			code: "FORBIDDEN",
			data: { code: "ROLE_NOT_ALLOWED" },
		});
		expect(getMarginNotes).not.toHaveBeenCalled();
	});

	it("refuses anyone outside the household", async () => {
		signedInAs("user-karan");

		await expect(call(listMarginNotes, input, { context })).rejects.toMatchObject({
			code: "FORBIDDEN",
			data: { code: "NOT_A_MEMBER" },
		});
		expect(getMarginNotes).not.toHaveBeenCalled();
	});
});
