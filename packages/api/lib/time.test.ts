import { formatHandleRef, generateHandle, normalizeHandle } from "@repo/database/drizzle/domain";
import { describe, expect, it } from "vitest";

import { ageFromDateOfBirth, startOfLocalDay, toLocalDateString, zonedTimeToUtc } from "./time";

describe("time helpers", () => {
	it("finds the household-local day start across DST", () => {
		expect(
			startOfLocalDay(new Date("2026-09-26T03:30:00Z"), "America/New_York").toISOString(),
		).toBe("2026-09-25T04:00:00.000Z");
		expect(zonedTimeToUtc("2026-12-01", 19, 0, "America/New_York").toISOString()).toBe(
			"2026-12-02T00:00:00.000Z",
		);
		expect(toLocalDateString(new Date("2026-09-26T20:00:00Z"), "Asia/Kolkata")).toBe(
			"2026-09-27",
		);
	});

	it("counts whole years of age", () => {
		expect(ageFromDateOfBirth("1997-03-14", new Date("2026-09-26T00:00:00Z"))).toBe(29);
		expect(ageFromDateOfBirth("2008-09-27", new Date("2026-09-26T00:00:00Z"))).toBe(17);
	});
});

describe("page handles", () => {
	it("generates six Crockford characters and prints them as a reference", () => {
		const handle = generateHandle();
		expect(handle).toMatch(/^[0-9a-hjkmnp-tv-z]{6}$/);
		expect(formatHandleRef("7kq2m9")).toBe("7KQ-2M9");
	});

	it("normalises what people type", () => {
		expect(normalizeHandle("No. 7KQ-2M9")).toBe("7kq2m9");
		expect(normalizeHandle("7kq-2mo")).toBe("7kq2m0");
	});
});
