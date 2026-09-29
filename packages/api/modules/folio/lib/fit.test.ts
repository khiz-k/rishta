import { describe, expect, it } from "vitest";

import {
	dailyTiebreak,
	evaluateFit,
	evaluateFitKey,
	isMutuallyEligible,
	scoreFit,
	selectReasons,
	type FitPage,
	type FitPreference,
	type FitSide,
} from "./fit";

const NOW = new Date("2026-09-26T20:00:00Z");

function page(overrides: Partial<FitPage> = {}): FitPage {
	return {
		gender: "female",
		dateOfBirth: "1997-03-14",
		height: 163,
		religion: "hindu",
		diet: "veg",
		maritalStatus: "never_married",
		education: "professional",
		profession: "Pharmacist",
		community: "Punjabi",
		motherTongue: "Punjabi",
		languages: ["Hindi", "English"],
		location: "Edison, New Jersey",
		country: "US",
		residency: "citizen",
		nativePlace: "Jalandhar, Punjab",
		aboutMe: null,
		lookingFor: null,
		fieldVisibility: {},
		publishedAt: new Date("2026-09-01T00:00:00Z"),
		...overrides,
	};
}

function preference(overrides: Partial<FitPreference> = {}): FitPreference {
	return {
		seeking: "male",
		marriageTimeline: "1_year",
		relocation: "within_country",
		residencyRequirement: "open",
		ageMin: 28,
		ageMax: 36,
		heightMin: null,
		heightMax: null,
		religions: ["hindu", "sikh", "jain"],
		communities: [],
		educationLevels: [],
		locations: [],
		countries: [],
		diet: ["veg", "eggetarian", "jain_veg"],
		maritalStatus: ["never_married", "divorced"],
		dealbreakers: ["timeline", "age", "marital_status"],
		valuesLooks: 2,
		valuesPersonality: 6,
		valuesFinancial: 4,
		...overrides,
	};
}

const priya: FitSide = { page: page(), preference: preference() };

function man(
	pageOverrides: Partial<FitPage> = {},
	preferenceOverrides: Partial<FitPreference> = {},
): FitSide {
	return {
		page: page({
			gender: "male",
			dateOfBirth: "1994-06-02",
			height: 178,
			profession: "Family physician",
			community: null,
			motherTongue: "Punjabi",
			languages: ["Hindi", "English"],
			location: "Toronto, Ontario",
			country: "CA",
			nativePlace: "Ludhiana, Punjab",
			...pageOverrides,
		}),
		preference: preference({
			seeking: "female",
			ageMin: 25,
			ageMax: 33,
			religions: [],
			diet: [],
			dealbreakers: ["timeline"],
			relocation: "open",
			...preferenceOverrides,
		}),
	};
}

describe("evaluateFitKey", () => {
	it("fits a timeline within one bucket and gaps beyond it", () => {
		expect(
			evaluateFitKey("timeline", priya, man({}, { marriageTimeline: "6_months" }), NOW)
				?.verdict,
		).toBe("fits");
		expect(
			evaluateFitKey("timeline", priya, man({}, { marriageTimeline: "2_years_plus" }), NOW)
				?.verdict,
		).toBe("fits");
		const far = { ...priya, preference: preference({ marriageTimeline: "3_months" }) };
		expect(
			evaluateFitKey("timeline", far, man({}, { marriageTimeline: "2_years_plus" }), NOW)
				?.verdict,
		).toBe("gap");
	});

	it("is unknown when either side has not stated a timeline", () => {
		expect(
			evaluateFitKey("timeline", priya, man({}, { marriageTimeline: null }), NOW)?.verdict,
		).toBe("unknown");
	});

	it("skips religion when the reader listed none", () => {
		const open = { ...priya, preference: preference({ religions: [] }) };
		expect(evaluateFitKey("religion", open, man(), NOW)).toBeNull();
	});

	it("never reveals a matching-only religion in the reason params", () => {
		const hidden = man({ religion: "muslim", fieldVisibility: { religion: "matching_only" } });
		const reason = evaluateFitKey("religion", priya, hidden, NOW);
		expect(reason?.verdict).toBe("gap");
		expect(reason?.params).toEqual({});
	});

	it("checks age against the stated range", () => {
		expect(evaluateFitKey("age", priya, man({ dateOfBirth: "1994-06-02" }), NOW)).toEqual({
			key: "age",
			verdict: "fits",
			params: { age: "32" },
		});
		expect(evaluateFitKey("age", priya, man({ dateOfBirth: "1985-01-01" }), NOW)?.verdict).toBe(
			"gap",
		);
	});

	it("fits location when either side is open to relocating", () => {
		const reason = evaluateFitKey("location", priya, man(), NOW);
		expect(reason?.verdict).toBe("fits");
		expect(reason?.params.basis).toBe("they_relocate");
	});

	it("gaps location across countries when nobody will move", () => {
		const settled = man({}, { relocation: "not_open" });
		const reason = evaluateFitKey("location", priya, settled, NOW);
		expect(reason).toMatchObject({ verdict: "gap", params: { basis: "different_country" } });
	});

	it("fits location within one country when someone will move within it", () => {
		const nearby = man(
			{ location: "Jersey City, New Jersey", country: "US" },
			{ relocation: "not_open" },
		);
		expect(evaluateFitKey("location", priya, nearby, NOW)?.params.basis).toBe("same_country");
	});

	it("reports a shared language as a fit and never as a gap", () => {
		expect(evaluateFitKey("language", priya, man(), NOW)).toMatchObject({
			verdict: "fits",
			params: { language: "Punjabi" },
		});
		const noShared = man({ motherTongue: "Tamil", languages: ["Tamil"] });
		expect(evaluateFitKey("language", priya, noShared, NOW)).toBeNull();
	});

	it("marks community unknown when the page does not state it", () => {
		const reader = { ...priya, preference: preference({ communities: ["Punjabi"] }) };
		expect(evaluateFitKey("community", reader, man({ community: null }), NOW)).toMatchObject({
			verdict: "unknown",
			params: { stated: "false" },
		});
	});

	it("only evaluates residency when the reader requires citizenship or PR", () => {
		expect(evaluateFitKey("residency", priya, man(), NOW)).toBeNull();
		const strict = {
			...priya,
			preference: preference({ residencyRequirement: "citizen_or_pr" }),
		};
		expect(
			evaluateFitKey("residency", strict, man({ residency: "work_visa" }), NOW)?.verdict,
		).toBe("gap");
		expect(evaluateFitKey("residency", strict, man({ residency: null }), NOW)?.verdict).toBe(
			"unknown",
		);
	});
});

describe("isMutuallyEligible", () => {
	it("admits a page that passes both sides' dealbreakers", () => {
		expect(isMutuallyEligible(priya, man(), NOW)).toBe(true);
	});

	it("excludes a page that fails the reader's dealbreaker", () => {
		expect(isMutuallyEligible(priya, man({ maritalStatus: "widowed" }), NOW)).toBe(false);
	});

	it("excludes a page whose own dealbreakers exclude the reader", () => {
		const strict = man({}, { dealbreakers: ["timeline", "diet"], diet: ["non_veg"] });
		expect(isMutuallyEligible(priya, strict, NOW)).toBe(false);
	});

	it("lets unknowns pass a dealbreaker", () => {
		const unstated = man({}, { marriageTimeline: null });
		expect(isMutuallyEligible(priya, unstated, NOW)).toBe(true);
	});
});

describe("selectReasons", () => {
	it("puts the reader's dealbreakers first, then gaps, fits and unknowns, at most six", () => {
		const reasons = evaluateFit(priya, man({ religion: "muslim", diet: "non_veg" }), NOW);
		const selected = selectReasons(reasons, ["timeline", "age", "marital_status"]);
		expect(selected.length).toBeLessThanOrEqual(6);
		expect(selected.slice(0, 3).map((reason) => reason.key)).toEqual([
			"timeline",
			"age",
			"marital_status",
		]);
		expect(selected[3]?.verdict).toBe("gap");
	});
});

describe("scoreFit", () => {
	it("scores nice-to-have fits above gaps and never counts dealbreakers", () => {
		const good = man();
		const worse = man({ religion: "muslim", diet: "non_veg" });
		const goodScore = scoreFit(evaluateFit(priya, good, NOW), priya, good, NOW);
		const worseScore = scoreFit(evaluateFit(priya, worse, NOW), priya, worse, NOW);
		expect(goodScore).toBeGreaterThan(worseScore);
	});

	it("adds the values-budget tie-breakers", () => {
		const plain = man({ profession: null });
		const described = man({ aboutMe: "a".repeat(200), lookingFor: "b".repeat(150) });
		const withPhoto: FitSide = { ...man(), photoVisibilities: ["after_note"] };
		const base = scoreFit(evaluateFit(priya, plain, NOW), priya, plain, NOW);
		expect(scoreFit(evaluateFit(priya, man(), NOW), priya, man(), NOW)).toBe(base + 20);
		expect(scoreFit(evaluateFit(priya, described, NOW), priya, described, NOW)).toBe(
			base + 20 + 30,
		);
		expect(scoreFit(evaluateFit(priya, withPhoto, NOW), priya, withPhoto, NOW)).toBe(
			base + 20 + 10,
		);
	});
});

describe("dailyTiebreak", () => {
	it("is stable for a day and changes across days", () => {
		expect(dailyTiebreak("org", "page", "2026-09-26")).toBe(
			dailyTiebreak("org", "page", "2026-09-26"),
		);
		expect(dailyTiebreak("org", "page", "2026-09-26")).not.toBe(
			dailyTiebreak("org", "page", "2026-09-27"),
		);
	});
});
