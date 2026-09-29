import { describe, expect, it } from "vitest";

import { getZonedParts } from "../../../lib/time";
import { firstSharedSlot, proposeEvenings, validateProposedSlots } from "./slots";

function localMinutes(date: Date, timeZone: string) {
	const parts = getZonedParts(date, timeZone);
	return parts.hour * 60 + parts.minute;
}

describe("proposeEvenings", () => {
	const now = new Date("2026-09-26T16:00:00Z");

	it("proposes three evenings that suit both time zones", () => {
		const slots = proposeEvenings({
			now,
			timeZoneA: "America/New_York",
			timeZoneB: "America/Chicago",
		});
		expect(slots).toHaveLength(3);
		for (const slot of slots) {
			expect(slot.getTime() % (30 * 60 * 1000)).toBe(0);
			for (const zone of ["America/New_York", "America/Chicago"]) {
				const minutes = localMinutes(slot, zone);
				expect(minutes).toBeGreaterThanOrEqual(18 * 60);
				expect(minutes).toBeLessThanOrEqual(21 * 60 + 30);
			}
		}
		// Three different evenings, in order.
		expect(new Set(slots.map((slot) => slot.toISOString().slice(0, 10))).size).toBe(3);
		expect([...slots].sort((a, b) => a.getTime() - b.getTime())).toEqual(slots);
	});

	it("starts at the middle of the shared evening (8:00 pm Edison, 7:00 pm Dallas)", () => {
		const [first] = proposeEvenings({
			now,
			timeZoneA: "America/New_York",
			timeZoneB: "America/Chicago",
		});
		expect(first && localMinutes(first, "America/New_York")).toBe(20 * 60);
	});

	it("falls back to a wider window when the zones share no evening", () => {
		const slots = proposeEvenings({
			now,
			timeZoneA: "Europe/London",
			timeZoneB: "America/Los_Angeles",
		});
		expect(slots).toHaveLength(3);
		for (const slot of slots) {
			expect(localMinutes(slot, "America/Los_Angeles")).toBeGreaterThanOrEqual(8 * 60);
			expect(localMinutes(slot, "Europe/London")).toBeLessThanOrEqual(22 * 60 + 30);
		}
	});

	it("leaves at least half a day before the first evening", () => {
		const [first] = proposeEvenings({
			now,
			timeZoneA: "America/New_York",
			timeZoneB: "America/New_York",
		});
		expect(first && first.getTime() - now.getTime()).toBeGreaterThanOrEqual(
			18 * 60 * 60 * 1000,
		);
	});
});

describe("validateProposedSlots", () => {
	const now = new Date("2026-09-26T16:00:00Z");
	const ok = [
		new Date("2026-09-28T00:00:00Z"),
		new Date("2026-09-29T00:30:00Z"),
		new Date("2026-09-30T01:00:00Z"),
	];

	it("accepts three future, distinct, aligned slots within 21 days", () => {
		expect(validateProposedSlots(ok, now)).toBeNull();
	});

	it("names what is wrong", () => {
		expect(validateProposedSlots([ok[0] as Date, ok[0] as Date, ok[1] as Date], now)).toBe(
			"distinct",
		);
		expect(
			validateProposedSlots(
				[new Date("2026-09-20T00:00:00Z"), ok[1] as Date, ok[2] as Date],
				now,
			),
		).toBe("future");
		expect(
			validateProposedSlots(
				[new Date("2026-09-28T00:10:00Z"), ok[1] as Date, ok[2] as Date],
				now,
			),
		).toBe("aligned");
		expect(
			validateProposedSlots(
				[new Date("2026-11-28T00:00:00Z"), ok[1] as Date, ok[2] as Date],
				now,
			),
		).toBe("horizon");
	});
});

describe("firstSharedSlot", () => {
	it("books the lowest slot both ticked", () => {
		expect(firstSharedSlot([0, 1, 2], [2, 1])).toBe(1);
		expect(firstSharedSlot([0], [2])).toBeNull();
	});
});
