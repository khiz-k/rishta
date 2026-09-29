import { describe, expect, it } from "vitest";

import {
	HORIZON_DAYS,
	isEvening,
	isWithinHorizon,
	localMinutes,
	middayOf,
	timesOnDate,
	upcomingDates,
} from "../slots";

const NEW_YORK = "America/New_York";
const KOLKATA = "Asia/Kolkata";

describe("isEvening", () => {
	it("marks 6:00 pm through a 9:30 pm start, in each person's own zone", () => {
		// 00:00 UTC on 2 Oct is 8:00 pm in New York (EDT) and 5:30 am in Kolkata.
		const eightPmNewYork = new Date("2026-10-02T00:00:00Z");
		expect(isEvening(eightPmNewYork, NEW_YORK)).toBe(true);
		expect(isEvening(eightPmNewYork, KOLKATA)).toBe(false);

		expect(isEvening(new Date("2026-10-01T22:00:00Z"), NEW_YORK)).toBe(true);
		expect(isEvening(new Date("2026-10-01T21:59:00Z"), NEW_YORK)).toBe(false);
		expect(isEvening(new Date("2026-10-02T01:30:00Z"), NEW_YORK)).toBe(true);
		expect(isEvening(new Date("2026-10-02T01:31:00Z"), NEW_YORK)).toBe(false);
	});

	it("handles half-hour offsets", () => {
		expect(localMinutes(new Date("2026-10-02T13:00:00Z"), KOLKATA)).toBe(18 * 60 + 30);
		expect(isEvening(new Date("2026-10-02T13:00:00Z"), KOLKATA)).toBe(true);
	});
});

describe("upcomingDates", () => {
	it("starts tomorrow in the given zone, not in UTC", () => {
		// 20:00 UTC on 27 Sep is already 1:30 am on 28 Sep in Kolkata.
		const now = new Date("2026-09-27T20:00:00Z");
		expect(upcomingDates(KOLKATA, 3, now)).toEqual(["2026-09-29", "2026-09-30", "2026-10-01"]);
		expect(upcomingDates(NEW_YORK, 2, now)).toEqual(["2026-09-28", "2026-09-29"]);
	});

	it("crosses month ends", () => {
		expect(upcomingDates(NEW_YORK, 2, new Date("2026-10-30T15:00:00Z"))).toEqual([
			"2026-10-31",
			"2026-11-01",
		]);
	});
});

describe("timesOnDate", () => {
	it("offers half-hour starts from 5:00 pm to 10:30 pm", () => {
		const times = timesOnDate("2026-10-02", NEW_YORK);

		expect(times).toHaveLength(12);
		expect(times[0]?.toISOString()).toBe("2026-10-02T21:00:00.000Z");
		expect(times[1]?.toISOString()).toBe("2026-10-02T21:30:00.000Z");
		expect(times.at(-1)?.toISOString()).toBe("2026-10-03T02:30:00.000Z");
	});

	it("uses the zone's offset on that date, across a DST change", () => {
		// New York is back on EST (UTC-5) by the evening of 1 Nov 2026.
		expect(timesOnDate("2026-11-01", NEW_YORK)[0]?.toISOString()).toBe(
			"2026-11-01T22:00:00.000Z",
		);
	});
});

describe("middayOf", () => {
	it("is noon on that local date", () => {
		expect(middayOf("2026-10-02", KOLKATA).toISOString()).toBe("2026-10-02T06:30:00.000Z");
	});
});

describe("isWithinHorizon", () => {
	const now = new Date("2026-09-27T12:00:00Z");
	const day = 24 * 60 * 60 * 1000;

	it("accepts future times up to 21 days out", () => {
		expect(isWithinHorizon(new Date(now.getTime() + 60_000), now)).toBe(true);
		expect(isWithinHorizon(new Date(now.getTime() + HORIZON_DAYS * day), now)).toBe(true);
	});

	it("refuses the present, the past and anything beyond the horizon", () => {
		expect(isWithinHorizon(now, now)).toBe(false);
		expect(isWithinHorizon(new Date(now.getTime() - 1), now)).toBe(false);
		expect(isWithinHorizon(new Date(now.getTime() + HORIZON_DAYS * day + 1), now)).toBe(false);
	});
});
