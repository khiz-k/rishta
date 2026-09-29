import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/storage", () => ({
	getSignedUrl: vi.fn(async (path: string) => `https://storage.test/${path}`),
}));

vi.mock("@repo/logs", () => ({
	logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { pageRow, photoRow } from "../../../lib/test-fixtures";
import type { PageRelationship, PageView } from "../types";
import { firstNameOf, toPageView, type PageWithPhotos } from "./page-view";
import { isPhotoClearFor, toPagePhotos } from "./photos";

const NOW = new Date("2026-09-26T20:00:00Z");

function page(overrides: Partial<PageWithPhotos> = {}): PageWithPhotos {
	return { ...pageRow(), photos: [photoRow("after_yes")], ...overrides };
}

function view(relationship: PageRelationship, target = page(), phoneShared = false) {
	return toPageView(target, relationship, { now: NOW, phoneShared });
}

function sectionKeys(pageView: PageView) {
	return pageView.sections.flatMap((section) => section.fields.map((field) => field.key));
}

function sealedKeys(pageView: PageView) {
	return pageView.sealed.open ? pageView.sealed.fields.map((field) => field.key) : [];
}

/** Values that belong only in the sealed section (or nowhere) for a reader outside the page. */
const SEALED_VALUES = [
	"Priya Sharma",
	"Hackensack Meridian Health",
	"+17325550199",
	"1997-03-14",
	"06:45",
	"clear/",
];

describe("toPageView", () => {
	it("keeps the sealed section, full name and clear photos from a stranger", async () => {
		const pageView = await view("stranger");
		const serialized = JSON.stringify(pageView);

		expect(pageView.sealed).toEqual({ open: false });
		for (const value of SEALED_VALUES) {
			expect(serialized).not.toContain(value);
		}
		expect(pageView.header.displayName).toBe("Priya");
		expect(pageView.header.age).toBe(29);
	});

	it("shows the month and year of birth on the page, never the exact date", async () => {
		const pageView = await view("stranger");
		const personal = pageView.sections.find((section) => section.id === "personal");

		expect(personal?.fields[0]?.key).toBe("born");
		expect(sectionKeys(pageView)).not.toContain("dateOfBirth");
		expect(pageView.header.birthMonthYear).toBeTruthy();
	});

	it("never shows matching-only fields outside the household", async () => {
		for (const relationship of ["stranger", "i_wrote", "wrote_to_me", "introduced"] as const) {
			const pageView = await view(relationship);
			expect(sectionKeys(pageView)).not.toContain("residency");
			expect(sealedKeys(pageView)).not.toContain("residency");
		}
		for (const relationship of ["self", "household"] as const) {
			expect(sectionKeys(await view(relationship))).toContain("residency");
		}
	});

	it("opens the sealed section inside an introduction, without the phone until it is shared", async () => {
		const introduced = await view("introduced");

		expect(introduced.sealed.open).toBe(true);
		expect(sealedKeys(introduced)).toEqual(
			expect.arrayContaining(["fullName", "dateOfBirth", "employer", "incomeRange"]),
		);
		expect(sealedKeys(introduced)).not.toContain("contactPhone");

		const shared = await view("introduced", page(), true);
		expect(sealedKeys(shared)).toContain("contactPhone");
	});

	it("keeps the phone sealed even when the visibility map says page", async () => {
		const target = page({ fieldVisibility: { contactPhone: "page" } });

		expect(JSON.stringify(await view("stranger", target))).not.toContain("+17325550199");
		expect(JSON.stringify(await view("wrote_to_me", target))).not.toContain("+17325550199");
	});

	it("moves a field the candidate chose to seal out of the open sections", async () => {
		const target = page({ fieldVisibility: { profession: "sealed" } });

		expect(sectionKeys(await view("stranger", target))).not.toContain("profession");
		expect(sealedKeys(await view("introduced", target))).toContain("profession");
		expect(sectionKeys(await view("stranger"))).toContain("profession");
	});

	it("reads Urdu pages right to left", async () => {
		expect((await view("stranger", page({ pageLanguage: "ur" }))).dir).toBe("rtl");
		expect((await view("stranger")).dir).toBe("ltr");
	});

	it("gives a stranger only the server-made veil", async () => {
		const [photo] = (await view("stranger")).photos;

		expect(photo?.veiled).toBe(true);
		expect(photo?.url).toContain("veil/");
	});
});

describe("isPhotoClearFor", () => {
	it("opens every photo to the page's own people and inside an introduction", () => {
		for (const relationship of ["self", "household", "introduced"] as const) {
			for (const visibility of ["everyone", "after_note", "after_yes"] as const) {
				expect(isPhotoClearFor(visibility, relationship)).toBe(true);
			}
		}
	});

	it("opens after-note photos only to someone this page wrote to", () => {
		expect(isPhotoClearFor("after_note", "wrote_to_me")).toBe(true);
		expect(isPhotoClearFor("after_note", "i_wrote")).toBe(false);
		expect(isPhotoClearFor("after_note", "stranger")).toBe(false);
	});

	it("keeps after-yes photos veiled until both say yes", () => {
		for (const relationship of ["stranger", "i_wrote", "wrote_to_me"] as const) {
			expect(isPhotoClearFor("after_yes", relationship)).toBe(false);
		}
	});

	it("never sends a clear photo through a family link", () => {
		for (const visibility of ["everyone", "after_note", "after_yes"] as const) {
			expect(isPhotoClearFor(visibility, "family_link")).toBe(false);
		}
	});
});

describe("toPagePhotos", () => {
	it("signs the clear image only when the reader may see it", async () => {
		const photos = [photoRow("everyone"), photoRow("after_yes")];

		const forStranger = await toPagePhotos(photos, "stranger");
		expect(forStranger.map((photo) => photo.url)).toEqual([
			"https://storage.test/clear/photo-everyone.jpg",
			"https://storage.test/veil/photo-after_yes.jpg",
		]);

		const forIntroduction = await toPagePhotos(photos, "introduced");
		expect(forIntroduction.every((photo) => !photo.veiled)).toBe(true);
	});

	it("serves seed photos stored as external URLs as they are", async () => {
		const [photo] = await toPagePhotos(
			[photoRow("everyone", { storageKey: "external:https://img.test/a.png" })],
			"stranger",
		);

		expect(photo?.url).toBe("https://img.test/a.png");
	});
});

describe("firstNameOf", () => {
	it("keeps only the first name", () => {
		expect(firstNameOf("  Priya Sharma ")).toBe("Priya");
		expect(firstNameOf("Harpreet Singh Gill")).toBe("Harpreet");
	});
});
