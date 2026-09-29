import { describe, expect, it, vi } from "vitest";

// The household context module reads the database; these tests only need its pure helpers.
vi.mock("@repo/database", () => ({}));

import { FIXTURE_CREATED_AT, marginNoteRow, pageRow } from "../../../lib/test-fixtures";
import { defaultHouseholdSettings, type HouseholdContext } from "../../households/lib/context";
import {
	groupMarginNotes,
	isReadableBy,
	marginReaderOf,
	toMarginNote,
	toMarginNotes,
	type MarginReader,
} from "./format";

const candidate: MarginReader = { userId: "user-priya", candidateUserId: "user-priya" };
const guardian: MarginReader = { userId: "user-sunita", candidateUserId: "user-priya" };
const family: MarginReader = { userId: "user-kabir", candidateUserId: "user-priya" };

const ammi = marginNoteRow();
const priyasOwn = marginNoteRow({
	id: "note-priya",
	authorUserId: "user-priya",
	authorLabel: "Priya",
	reaction: null,
	text: "Ask him about the night shifts.",
});
const nani = marginNoteRow({
	id: "note-nani",
	authorUserId: null,
	familyLinkId: "link-1",
	authorLabel: "Nani",
	reaction: "lets_talk",
});

describe("toMarginNote", () => {
	it("signs an in-app note with the household label and marks the viewer's own", () => {
		expect(toMarginNote(ammi, "user-sunita")).toEqual({
			id: "note-ammi",
			authorLabel: "Ammi",
			via: "app",
			reaction: "proceed",
			text: null,
			isMine: true,
			createdAt: FIXTURE_CREATED_AT.toISOString(),
			updatedAt: FIXTURE_CREATED_AT.toISOString(),
		});
		expect(toMarginNote(ammi, "user-priya").isMine).toBe(false);
	});

	it("marks a note left through a family link", () => {
		const note = toMarginNote(nani, "user-priya");
		expect(note.via).toBe("link");
		expect(note.isMine).toBe(false);
	});
});

describe("isReadableBy", () => {
	it("keeps the candidate's own notes to the candidate", () => {
		expect(isReadableBy(priyasOwn, candidate)).toBe(true);
		expect(isReadableBy(priyasOwn, guardian)).toBe(false);
		expect(isReadableBy(priyasOwn, family)).toBe(false);
	});

	it("shares every other note with the whole household", () => {
		for (const reader of [candidate, guardian, family]) {
			expect(isReadableBy(ammi, reader)).toBe(true);
			expect(isReadableBy(nani, reader)).toBe(true);
		}
	});

	it("has no private notes before the page is claimed", () => {
		const drafting: MarginReader = { userId: "user-kabir", candidateUserId: null };
		expect(isReadableBy(priyasOwn, drafting)).toBe(true);
	});
});

describe("toMarginNotes", () => {
	it("drops the candidate's notes for anyone else, keeping the order", () => {
		const rows = [nani, priyasOwn, ammi];

		expect(toMarginNotes(rows, candidate).map((note) => note.id)).toEqual([
			"note-nani",
			"note-priya",
			"note-ammi",
		]);
		expect(toMarginNotes(rows, guardian).map((note) => note.id)).toEqual([
			"note-nani",
			"note-ammi",
		]);
	});
});

describe("marginReaderOf", () => {
	it("reads the candidate from the household's claimed page", () => {
		const context: HouseholdContext = {
			organizationId: "org-priya",
			organizationName: "Priya",
			slug: "priya-k3m",
			userId: "user-kabir",
			role: "member",
			isCandidate: false,
			page: { ...pageRow(), photos: [] },
			settings: defaultHouseholdSettings("org-priya"),
		};

		expect(marginReaderOf(context)).toEqual(family);
		expect(marginReaderOf({ ...context, page: null }).candidateUserId).toBeNull();
	});
});

describe("groupMarginNotes", () => {
	it("groups notes by the page they sit beside, keeping their order", () => {
		const grouped = groupMarginNotes(
			[
				marginNoteRow({ id: "a", profileId: "page-arjun" }),
				marginNoteRow({
					id: "b",
					profileId: "page-kabir",
					reaction: null,
					text: "Call first",
				}),
				marginNoteRow({ id: "c", profileId: "page-arjun", reaction: "lets_talk" }),
			],
			candidate,
		);

		expect([...grouped.keys()]).toEqual(["page-arjun", "page-kabir"]);
		expect(grouped.get("page-arjun")?.map((note) => note.id)).toEqual(["a", "c"]);
		expect(grouped.get("page-kabir")?.[0]?.text).toBe("Call first");
		expect(grouped.get("page-none")).toBeUndefined();
	});

	it("leaves no trace of a page whose only note is the candidate's, for anyone else", () => {
		const grouped = groupMarginNotes([priyasOwn], guardian);
		expect(grouped.get("page-arjun")).toBeUndefined();
	});
});
