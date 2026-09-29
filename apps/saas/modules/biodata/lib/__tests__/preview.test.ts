import type { FieldVisibilityMap } from "@repo/database/drizzle/domain";
import type { MyPage, PageView } from "@shared/lib/api-types";
import { describe, expect, it } from "vitest";

import { previewView } from "../preview";

/** The owner view the server sends for your own page: shown and matching-only fields, sealed open. */
function ownerView(): PageView {
	return {
		handle: "priya-k3m",
		ref: "7KQ-2M9",
		relationship: "self",
		status: "active",
		language: "en",
		dir: "ltr",
		invocation: null,
		header: {
			displayName: "Priya S.",
			age: 29,
			birthMonthYear: "1997-03",
			heightCm: 163,
			city: "Edison, New Jersey",
			country: "United States",
			signer: { createdBy: "self", confirmedByCandidate: true, candidateFirstName: "Priya" },
			verification: "phone",
		},
		sections: [
			{
				id: "personal",
				fields: [
					{ key: "born", value: "1997-03" },
					{ key: "religion", value: "hindu" },
					{ key: "community", value: "Punjabi" },
					{ key: "residency", value: "citizen" },
				],
			},
			{
				id: "family",
				fields: [{ key: "fatherOccupation", value: "Retired civil engineer" }],
				text: "A small, close family in Edison.",
			},
		],
		photos: [
			{ id: "p1", url: "clear-1", veiled: false, width: 800, height: 1000 },
			{ id: "p2", url: "clear-2", veiled: false, width: 800, height: 1000 },
		],
		sealed: {
			open: true,
			fields: [
				{ key: "fullName", value: "Priya Sharma" },
				{ key: "contactPhone", value: "+1 732 555 0100" },
			],
		},
		updatedAt: "2026-09-21T10:00:00.000Z",
	};
}

/**
 * previewView reads only the owner view, the visibility map and the owner photos, so the
 * fixture carries just those parts of MyPage.
 */
function myPage(fieldVisibility: FieldVisibilityMap = {}): MyPage {
	const fixture = {
		view: ownerView(),
		page: { fieldVisibility },
		photos: [
			{
				id: "p1",
				position: 0,
				visibility: "everyone",
				width: 800,
				height: 1000,
				url: "clear-1",
				veilUrl: "veil-1",
			},
			{
				id: "p2",
				position: 1,
				visibility: "after_yes",
				width: 800,
				height: 1000,
				url: "clear-2",
				veilUrl: "veil-2",
			},
		],
	};
	return fixture as unknown as MyPage;
}

function fieldKeys(view: PageView) {
	return view.sections.flatMap((section) => section.fields.map((field) => field.key));
}

describe("previewView", () => {
	it("returns the owner view unchanged while editing", () => {
		const page = myPage();
		expect(previewView(page, "self")).toBe(page.view);
	});

	it("shows a stranger no matching-only field and no sealed section", () => {
		const view = previewView(myPage({ community: "matching_only" }), "stranger");
		expect(fieldKeys(view)).not.toContain("community");
		// Residency is matching only by default.
		expect(fieldKeys(view)).not.toContain("residency");
		expect(fieldKeys(view)).toContain("religion");
		expect(view.sealed).toEqual({ open: false });
		expect(view.relationship).toBe("stranger");
	});

	it("hides matching-only header facts and family text from a stranger", () => {
		const view = previewView(
			myPage({
				height: "matching_only",
				location: "matching_only",
				aboutFamily: "matching_only",
			}),
			"stranger",
		);
		expect(view.header.heightCm).toBeUndefined();
		expect(view.header.city).toBeUndefined();
		expect(view.header.country).toBe("United States");
		const family = view.sections.find((section) => section.id === "family");
		expect(family?.text).toBeUndefined();
		expect(family?.fields.map((field) => field.key)).toEqual(["fatherOccupation"]);
	});

	it("keeps shown header facts and family text for a stranger", () => {
		const view = previewView(myPage(), "stranger");
		expect(view.header.heightCm).toBe(163);
		expect(view.header.city).toBe("Edison, New Jersey");
		expect(view.sections.find((section) => section.id === "family")?.text).toBe(
			"A small, close family in Edison.",
		);
	});

	it("veils every photo not cleared for everyone, using the veil image", () => {
		const view = previewView(myPage(), "stranger");
		expect(view.photos).toEqual([
			{ id: "p1", url: "clear-1", veiled: false, width: 800, height: 1000 },
			{ id: "p2", url: "veil-2", veiled: true, width: 800, height: 1000 },
		]);
	});

	it("veils every photo on a family link", () => {
		const view = previewView(myPage(), "family_link");
		expect(view.photos.every((photo) => photo.veiled)).toBe(true);
		expect(view.photos.map((photo) => photo.url)).toEqual(["veil-1", "veil-2"]);
		expect(view.sealed).toEqual({ open: false });
	});

	it("opens the sealed section and clears photos once both say yes", () => {
		const view = previewView(myPage(), "introduced");
		expect(view.sealed.open).toBe(true);
		expect(view.photos.every((photo) => !photo.veiled)).toBe(true);
		// Matching-only fields still never leave the household.
		expect(fieldKeys(view)).not.toContain("residency");
	});
});
