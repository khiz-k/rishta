import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Standalone so the assertions never reference a method off the mocked client.
const { update, remove, transaction } = vi.hoisted(() => ({
	update: vi.fn(),
	remove: vi.fn(),
	transaction: vi.fn(),
}));

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@repo/database", async () => ({
	...(await vi.importActual<object>("@repo/database/drizzle/domain")),
	...(await vi.importActual<object>("@repo/database/drizzle/schema")),
	db: { update, delete: remove, transaction },
	getOrganizationMembership: vi.fn(),
	getPageByOrganizationId: vi.fn(),
	getHouseholdSetting: vi.fn(),
	getPhotoById: vi.fn(),
	getFolioPageById: vi.fn(),
	getPageById: vi.fn(),
	getMarginNoteById: vi.fn(),
	getFamilyLinkById: vi.fn(),
	getProposalById: vi.fn(),
	getMatchById: vi.fn(),
	getPageByHandle: vi.fn(),
	getPageByUserId: vi.fn(),
	getLetterById: vi.fn(),
	isBlockedEitherWay: vi.fn(),
	getLettersBetweenUsers: vi.fn(),
	createReport: vi.fn(),
}));

vi.mock("@repo/storage", () => ({ getSignedUrl: vi.fn(), deleteObject: vi.fn() }));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("../../notifications/lib/notify", () => ({ notifyUser: vi.fn() }));

import {
	createReport,
	getFamilyLinkById,
	getFolioPageById,
	getMarginNoteById,
	getPageByHandle,
	getPhotoById,
	getProposalById,
	isBlockedEitherWay,
} from "@repo/database";
import { deleteObject } from "@repo/storage";

import {
	FIXTURE_CREATED_AT,
	marginNoteRow,
	matchRow,
	pageRow,
	photoRow,
	proposalRow,
} from "../../../lib/test-fixtures";
import {
	priyaHousehold,
	procedureContext as context,
	signedInAs,
} from "../../../lib/test-household";
import { revokeFamilyLink } from "../../family-links/procedures/revoke-link";
import { markFolioPage } from "../../folio/procedures/mark-page";
import { removeMarginNote } from "../../margin/procedures/remove-note";
import { setAvailability } from "../../matches/procedures/set-availability";
import { removePhoto } from "../../profiles/procedures/photos/remove-photo";
import { updatePhoto } from "../../profiles/procedures/photos/update-photo";
import { createReportProcedure } from "../../reports/procedures/create-report";
import { getHouseholdRow } from "./context";

/**
 * Quality rule S1: a record looked up by id answers the same for "there is no such record" and
 * "it belongs to a household you are not in", and nothing is read or written for a stranger.
 * Karan is signed in and belongs to no household in these tests; Priya's household is
 * `org-priya`, Arjun's is `org-arjun`.
 */
const arjunsPhoto = photoRow("after_note", {
	id: "photo-arjun",
	profileId: "page-arjun",
	organizationId: "org-arjun",
});

const arjunsFamilyLink = {
	id: "link-arjun",
	organizationId: "org-arjun",
	createdByUserId: "user-arjun",
	profileId: "page-priya",
	letterId: null,
	tokenHash: "hash",
	recipientLabel: "Nani",
	language: "hi" as const,
	expiresAt: FIXTURE_CREATED_AT,
	revokedAt: null,
	firstOpenedAt: null,
	lastOpenedAt: null,
	openCount: 0,
	createdAt: FIXTURE_CREATED_AT,
};

async function answerFor(attempt: Promise<unknown>) {
	try {
		await attempt;
	} catch (error) {
		const { code, data } = error as { code: string; data?: { code?: string } };
		return { status: code, code: data?.code };
	}
	throw new Error("expected the call to be refused");
}

beforeEach(() => {
	vi.clearAllMocks();
	priyaHousehold();
});

describe("getHouseholdRow", () => {
	it("answers a missing record and another household's record alike", async () => {
		const missing = await answerFor(
			getHouseholdRow(undefined, "user-priya", "PHOTO_NOT_FOUND"),
		);
		const foreign = await answerFor(
			getHouseholdRow(arjunsPhoto, "user-priya", "PHOTO_NOT_FOUND"),
		);

		expect(missing).toEqual({ status: "NOT_FOUND", code: "PHOTO_NOT_FOUND" });
		expect(foreign).toEqual(missing);
	});

	it("gives a member the record with their household context", async () => {
		const photo = photoRow("after_note");

		const { row, context: household } = await getHouseholdRow(
			photo,
			"user-sunita",
			"PHOTO_NOT_FOUND",
		);

		expect(row).toBe(photo);
		expect(household).toMatchObject({ organizationId: "org-priya", role: "admin" });
	});
});

describe("updatePhoto", () => {
	it("answers a stranger the same for a missing photo and another household's", async () => {
		signedInAs("user-priya");
		const input = { photoId: "photo-arjun", visibility: "after_yes" as const };

		vi.mocked(getPhotoById).mockResolvedValueOnce(undefined);
		const missing = await answerFor(call(updatePhoto, input, { context }));
		vi.mocked(getPhotoById).mockResolvedValueOnce(arjunsPhoto);
		const foreign = await answerFor(call(updatePhoto, input, { context }));

		expect(missing).toEqual({ status: "NOT_FOUND", code: "PHOTO_NOT_FOUND" });
		expect(foreign).toEqual(missing);
		expect(transaction).not.toHaveBeenCalled();
	});
});

describe("removePhoto", () => {
	it("answers a stranger the same for a missing photo and another household's", async () => {
		signedInAs("user-priya");

		vi.mocked(getPhotoById).mockResolvedValueOnce(undefined);
		const missing = await answerFor(call(removePhoto, { photoId: "photo-arjun" }, { context }));
		vi.mocked(getPhotoById).mockResolvedValueOnce(arjunsPhoto);
		const foreign = await answerFor(call(removePhoto, { photoId: "photo-arjun" }, { context }));

		expect(missing).toEqual({ status: "NOT_FOUND", code: "PHOTO_NOT_FOUND" });
		expect(foreign).toEqual(missing);
		expect(remove).not.toHaveBeenCalled();
		expect(deleteObject).not.toHaveBeenCalled();
	});
});

describe("markFolioPage", () => {
	it("answers a stranger the same for a missing folio page and another household's", async () => {
		signedInAs("user-karan");
		const input = { folioPageId: "folio-page-1", state: "kept" as const };

		vi.mocked(getFolioPageById).mockResolvedValueOnce(undefined);
		const missing = await answerFor(call(markFolioPage, input, { context }));
		vi.mocked(getFolioPageById).mockResolvedValueOnce({
			id: "folio-page-1",
			organizationId: "org-priya",
			profileId: "page-arjun",
			state: "unread",
		} as never);
		const foreign = await answerFor(call(markFolioPage, input, { context }));

		expect(missing).toEqual({ status: "NOT_FOUND", code: "FOLIO_PAGE_NOT_FOUND" });
		expect(foreign).toEqual(missing);
		expect(update).not.toHaveBeenCalled();
	});
});

describe("removeMarginNote", () => {
	it("answers a stranger the same for a missing pencil note and another household's", async () => {
		signedInAs("user-karan");

		vi.mocked(getMarginNoteById).mockResolvedValueOnce(undefined);
		const missing = await answerFor(
			call(removeMarginNote, { noteId: "note-ammi" }, { context }),
		);
		vi.mocked(getMarginNoteById).mockResolvedValueOnce(marginNoteRow());
		const foreign = await answerFor(
			call(removeMarginNote, { noteId: "note-ammi" }, { context }),
		);

		expect(missing).toEqual({ status: "NOT_FOUND", code: "NOTE_NOT_FOUND" });
		expect(foreign).toEqual(missing);
		expect(remove).not.toHaveBeenCalled();
	});

	it("still tells a member of the household that the note isn't theirs to remove", async () => {
		signedInAs("user-kabir");
		vi.mocked(getMarginNoteById).mockResolvedValueOnce(marginNoteRow());

		await expect(
			call(removeMarginNote, { noteId: "note-ammi" }, { context }),
		).rejects.toMatchObject({ code: "FORBIDDEN", data: { code: "ROLE_NOT_ALLOWED" } });
	});
});

describe("revokeFamilyLink", () => {
	it("answers the same for a missing family link and another household's", async () => {
		signedInAs("user-priya");

		vi.mocked(getFamilyLinkById).mockResolvedValueOnce(undefined);
		const missing = await answerFor(
			call(revokeFamilyLink, { linkId: "link-arjun" }, { context }),
		);
		vi.mocked(getFamilyLinkById).mockResolvedValueOnce(arjunsFamilyLink);
		const foreign = await answerFor(
			call(revokeFamilyLink, { linkId: "link-arjun" }, { context }),
		);

		expect(missing).toEqual({ status: "NOT_FOUND", code: "FAMILY_LINK_NOT_FOUND" });
		expect(foreign).toEqual(missing);
		expect(update).not.toHaveBeenCalled();
	});
});

describe("setAvailability", () => {
	it("answers the same for a missing proposal and one on someone else's introduction", async () => {
		signedInAs("user-karan");
		const input = { proposalId: "proposal-1", slotIndexes: [0] };

		vi.mocked(getProposalById).mockResolvedValueOnce(undefined);
		const missing = await answerFor(call(setAvailability, input, { context }));
		vi.mocked(getProposalById).mockResolvedValueOnce({
			...proposalRow(),
			match: matchRow(),
		});
		const foreign = await answerFor(call(setAvailability, input, { context }));

		expect(missing).toEqual({ status: "NOT_FOUND", code: "MATCH_NOT_FOUND" });
		expect(foreign).toEqual(missing);
		expect(transaction).not.toHaveBeenCalled();
	});
});

describe("createReportProcedure", () => {
	const report = {
		category: "scam_money" as const,
		alsoBlock: false,
		organizationId: "org-priya",
	};

	it("answers a page the household cannot see like a handle that does not exist", async () => {
		signedInAs("user-priya");
		vi.mocked(isBlockedEitherWay).mockResolvedValue(false);
		const input = { ...report, context: "page" as const, contextId: "7kq2m9" };

		vi.mocked(getPageByHandle).mockResolvedValueOnce(undefined);
		const missing = await answerFor(call(createReportProcedure, input, { context }));
		vi.mocked(getPageByHandle).mockResolvedValueOnce({
			...pageRow({
				id: "page-arjun",
				organizationId: "org-arjun",
				userId: null,
				handle: "7kq2m9",
				status: "awaiting_claim",
			}),
			photos: [],
		});
		const unclaimed = await answerFor(call(createReportProcedure, input, { context }));

		expect(missing).toEqual({ status: "NOT_FOUND", code: "PAGE_NOT_FOUND" });
		expect(unclaimed).toEqual(missing);
		expect(createReport).not.toHaveBeenCalled();
	});

	it("files nothing about a page without the household it was read from", async () => {
		signedInAs("user-priya");
		const { organizationId: _organizationId, ...withoutHousehold } = report;

		await expect(
			call(
				createReportProcedure,
				{ ...withoutHousehold, context: "page", contextId: "7kq2m9" },
				{ context },
			),
		).rejects.toMatchObject({ code: "NOT_FOUND", data: { code: "REPORT_CONTEXT_NOT_FOUND" } });
		expect(getPageByHandle).not.toHaveBeenCalled();
		expect(createReport).not.toHaveBeenCalled();
	});

	it("answers another household's family link like one that does not exist", async () => {
		signedInAs("user-priya");
		const input = { ...report, context: "family_link" as const, contextId: "link-arjun" };

		vi.mocked(getFamilyLinkById).mockResolvedValueOnce(undefined);
		const missing = await answerFor(call(createReportProcedure, input, { context }));
		vi.mocked(getFamilyLinkById).mockResolvedValueOnce(arjunsFamilyLink);
		const foreign = await answerFor(call(createReportProcedure, input, { context }));

		expect(missing).toEqual({ status: "NOT_FOUND", code: "REPORT_CONTEXT_NOT_FOUND" });
		expect(foreign).toEqual(missing);
		expect(createReport).not.toHaveBeenCalled();
	});
});
