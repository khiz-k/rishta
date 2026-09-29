import { describe, expect, it } from "vitest";

import { getReleaseWindow } from "./release";

describe("getReleaseWindow", () => {
	it("keeps yesterday's folio current before today's release", () => {
		// 17:00 in New York (EDT, UTC-4).
		const window = getReleaseWindow(new Date("2026-09-26T21:00:00Z"), "America/New_York", 19);
		expect(window.releaseDate).toBe("2026-09-25");
		expect(window.nextReleaseAt.toISOString()).toBe("2026-09-26T23:00:00.000Z");
	});

	it("releases today's folio at the household's hour", () => {
		// 19:30 in New York.
		const window = getReleaseWindow(new Date("2026-09-26T23:30:00Z"), "America/New_York", 19);
		expect(window.releaseDate).toBe("2026-09-26");
		expect(window.releasedAt.toISOString()).toBe("2026-09-26T23:00:00.000Z");
		expect(window.nextReleaseAt.toISOString()).toBe("2026-09-27T23:00:00.000Z");
	});

	it("uses the household's own day, not the server's", () => {
		// 02:00 UTC on the 27th is still the evening of the 26th in Chicago.
		const window = getReleaseWindow(new Date("2026-09-27T02:00:00Z"), "America/Chicago", 19);
		expect(window.releaseDate).toBe("2026-09-26");
	});
});
