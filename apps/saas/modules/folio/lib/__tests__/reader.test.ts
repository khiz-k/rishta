import type { FolioPageItem, LetterRef, LetterState } from "@shared/lib/api-types";
import { describe, expect, it } from "vitest";

import { canTakeBack, fromFolioPage, PASS_REASON_OPTIONS } from "../reader";

function letterRef(state: LetterState): LetterRef {
	return {
		letterId: "letter-1",
		state,
		isPriority: false,
		createdAt: "2026-09-26T19:30:00.000Z",
	};
}

/** A folio page whose page closed mid-read (the reader shows "closed by its family"). */
function folioItem(overrides: Partial<FolioPageItem> = {}): FolioPageItem {
	return {
		folioPageId: "folio-page-1",
		position: 0,
		state: "unread",
		seenBefore: false,
		page: null,
		reasons: [],
		pencilNotes: [],
		kept: false,
		myLetter: null,
		...overrides,
	};
}

describe("canTakeBack", () => {
	it("allows taking back only a sealed note still waiting for them", () => {
		expect(canTakeBack(letterRef("waiting_for_them"))).toBe(true);
	});

	it("treats every other state as settled", () => {
		const settled: LetterState[] = [
			"waiting_for_you",
			"introduced",
			"call_booked",
			"families",
			"introduction_closed",
			"declined_by_you",
			"declined_by_them",
			"withdrawn_by_you",
			"withdrawn_by_them",
			"expired",
			"closed",
		];
		for (const state of settled) {
			expect(canTakeBack(letterRef(state))).toBe(false);
		}
		expect(canTakeBack(null)).toBe(false);
	});
});

describe("fromFolioPage", () => {
	it("keys a folio page by its folio id and never answers it on the reader's behalf", () => {
		const item = fromFolioPage(folioItem({ seenBefore: true }));

		expect(item.key).toBe("folio-page-1");
		expect(item.folioPageId).toBe("folio-page-1");
		expect(item.state).toBe("unread");
		expect(item.passReason).toBeNull();
		expect(item.seenBefore).toBe(true);
		expect(item.keptBy).toBeNull();
	});

	it("counts a page kept today as kept, as well as one kept before", () => {
		expect(fromFolioPage(folioItem({ state: "kept" })).kept).toBe(true);
		expect(fromFolioPage(folioItem({ kept: true, state: "read" })).kept).toBe(true);
		expect(fromFolioPage(folioItem({ state: "passed" })).kept).toBe(false);
	});

	it("carries the sealed note the reader already wrote", () => {
		const myLetter = letterRef("waiting_for_them");
		expect(fromFolioPage(folioItem({ myLetter })).myLetter).toBe(myLetter);
	});
});

describe("PASS_REASON_OPTIONS", () => {
	it("offers each private pass reason once, ending with other", () => {
		expect(new Set(PASS_REASON_OPTIONS).size).toBe(PASS_REASON_OPTIONS.length);
		expect(PASS_REASON_OPTIONS.at(-1)).toBe("other");
	});
});
