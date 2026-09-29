import { describe, expect, it } from "vitest";

import { pageRow } from "../../../lib/test-fixtures";
import { getCompleteness, missingRequiredFields } from "./completeness";

describe("getCompleteness", () => {
	it("counts filled fields per section in words, not a score", () => {
		const completeness = getCompleteness(
			pageRow({ university: null, employer: "  ", siblings: null, languages: [] }),
			null,
		);

		expect(completeness.personal).toEqual({ filled: 6, total: 7 });
		expect(completeness.education).toEqual({ filled: 2, total: 4 });
		expect(completeness.family).toEqual({ filled: 4, total: 5 });
		expect(completeness.about).toEqual({ filled: 1, total: 1 });
		expect(completeness.looking_for).toEqual({ filled: 1, total: 2 });
	});

	it("counts false and zero as answers", () => {
		const completeness = getCompleteness(pageRow({ hasChildren: false }), null);

		expect(completeness.lifestyle).toEqual({ filled: 3, total: 3 });
	});
});

describe("missingRequiredFields", () => {
	it("lists the four fields a page needs before it can be published", () => {
		expect(missingRequiredFields(pageRow())).toEqual([]);
		expect(
			missingRequiredFields(
				pageRow({ displayName: " ", gender: null, dateOfBirth: null, religion: null }),
			),
		).toEqual(["displayName", "gender", "dateOfBirth", "religion"]);
	});
});
