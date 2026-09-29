import { describe, expect, it } from "vitest";

import {
	cityOf,
	daysSince,
	firstNameOf,
	formatBirthDate,
	formatFeetInches,
	formatHeight,
	formatMonthYear,
	intlLocale,
	isSameLocalDay,
	zonePlace,
} from "../format";

describe("heights", () => {
	it("writes feet and inches, rounding to the nearest inch", () => {
		expect(formatFeetInches(163)).toBe("5′4″");
		expect(formatFeetInches(178)).toBe("5′10″");
		expect(formatFeetInches(183)).toBe("6′0″");
		expect(formatHeight(178)).toBe("5′10″ (178 cm)");
	});
});

describe("dates", () => {
	it("uses day-month order for English", () => {
		expect(intlLocale("en")).toBe("en-GB");
		expect(intlLocale("de")).toBe("de");
		expect(formatBirthDate("1994-06-12", "en")).toBe("12 June 1994");
		expect(formatMonthYear("1994-06", "en")).toBe("June 1994");
		expect(formatMonthYear("1994-06-12", "en")).toBe("June 1994");
	});

	it("returns an unparseable value unchanged rather than an invalid date", () => {
		expect(formatMonthYear("unknown", "en")).toBe("unknown");
		expect(formatBirthDate("1994-06", "en")).toBe("1994-06");
	});

	it("counts whole days since, never negative", () => {
		const now = new Date("2026-09-27T12:00:00Z");
		expect(daysSince("2026-09-25T13:00:00Z", now)).toBe(1);
		expect(daysSince("2026-09-20T12:00:00Z", now)).toBe(7);
		expect(daysSince("2026-09-28T12:00:00Z", now)).toBe(0);
	});

	it("compares calendar days in a zone", () => {
		// 23:00 UTC on 26 Sep and 01:00 UTC on 27 Sep are the same evening in New York.
		expect(
			isSameLocalDay("2026-09-26T23:00:00Z", "2026-09-27T01:00:00Z", "America/New_York"),
		).toBe(true);
		expect(isSameLocalDay("2026-09-26T23:00:00Z", "2026-09-27T01:00:00Z", "UTC")).toBe(false);
	});
});

describe("names and places", () => {
	it("takes the first word of a display name", () => {
		expect(firstNameOf("Priya S.")).toBe("Priya");
		expect(firstNameOf("  Arjun  ")).toBe("Arjun");
	});

	it("takes the city from a location", () => {
		expect(cityOf("Edison, New Jersey")).toBe("Edison");
		expect(cityOf("London")).toBe("London");
		expect(cityOf("")).toBeNull();
		expect(cityOf(null)).toBeNull();
	});

	it("reads an IANA zone as a place", () => {
		expect(zonePlace("America/New_York")).toBe("New York");
		expect(zonePlace("Asia/Kolkata")).toBe("Kolkata");
		expect(zonePlace("UTC")).toBe("UTC");
	});
});
