import { describe, expect, it } from "vitest";

import { consumeRateLimit, getClientIp } from "./rate-limit";

const MINUTE = 60_000;

describe("consumeRateLimit", () => {
	it("allows up to the limit in a window, then refuses", () => {
		const key = "test:limit";
		const now = 1_000_000;

		expect(consumeRateLimit(key, 3, MINUTE, now)).toBe(true);
		expect(consumeRateLimit(key, 3, MINUTE, now + 1)).toBe(true);
		expect(consumeRateLimit(key, 3, MINUTE, now + 2)).toBe(true);
		expect(consumeRateLimit(key, 3, MINUTE, now + 3)).toBe(false);
	});

	it("opens a fresh window once the old one has passed", () => {
		const key = "test:window";
		const now = 2_000_000;

		expect(consumeRateLimit(key, 1, MINUTE, now)).toBe(true);
		expect(consumeRateLimit(key, 1, MINUTE, now + MINUTE - 1)).toBe(false);
		expect(consumeRateLimit(key, 1, MINUTE, now + MINUTE)).toBe(true);
	});

	it("counts each key on its own", () => {
		const now = 3_000_000;

		expect(consumeRateLimit("test:a", 1, MINUTE, now)).toBe(true);
		expect(consumeRateLimit("test:b", 1, MINUTE, now)).toBe(true);
		expect(consumeRateLimit("test:a", 1, MINUTE, now)).toBe(false);
	});
});

describe("getClientIp", () => {
	it("takes the first address of a forwarded chain", () => {
		const headers = new Headers({ "x-forwarded-for": " 203.0.113.7 , 10.0.0.1" });
		expect(getClientIp(headers)).toBe("203.0.113.7");
	});

	it("falls back to x-real-ip, then to a shared bucket", () => {
		expect(getClientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
		expect(getClientIp(new Headers())).toBe("unknown");
		expect(getClientIp(new Headers({ "x-forwarded-for": "" }))).toBe("unknown");
	});
});
