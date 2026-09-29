import { describe, expect, it } from "vitest";

import { buildCallInvite, foldLine } from "./ics";

const encoder = new TextEncoder();

function unfold(ics: string) {
	return ics.replace(/\r\n /g, "");
}

describe("buildCallInvite", () => {
	const invite = buildCallInvite({
		uid: "proposal-1",
		start: new Date("2026-10-02T00:00:00Z"),
		summary: "A first call, arranged on Rishta",
		description: "Your first call; contact stays sealed, until you share it.\nThu 2 Oct",
		url: "https://app.rishta.test/letters/letter-1",
		now: new Date("2026-09-27T12:00:00Z"),
	});

	it("writes one 30-minute event in UTC with CRLF line endings", () => {
		const lines = unfold(invite).split("\r\n");

		expect(lines[0]).toBe("BEGIN:VCALENDAR");
		expect(lines).toContain("UID:proposal-1@rishta");
		expect(lines).toContain("DTSTAMP:20260927T120000Z");
		expect(lines).toContain("DTSTART:20261002T000000Z");
		expect(lines).toContain("DTEND:20261002T003000Z");
		expect(lines).toContain("URL:https://app.rishta.test/letters/letter-1");
		expect(invite.endsWith("END:VCALENDAR\r\n")).toBe(true);
		expect(invite.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
	});

	it("escapes commas, semicolons and new lines in text", () => {
		expect(unfold(invite)).toContain(
			"DESCRIPTION:Your first call\\; contact stays sealed\\, until you share it.\\nThu 2 Oct",
		);
	});

	it("honours a custom duration", () => {
		const long = buildCallInvite({
			uid: "p",
			start: new Date("2026-10-02T00:00:00Z"),
			durationMinutes: 45,
			summary: "s",
			description: "d",
			now: new Date("2026-09-27T12:00:00Z"),
		});
		expect(long).toContain("DTEND:20261002T004500Z");
		expect(long).not.toContain("URL:");
	});
});

describe("foldLine", () => {
	it("leaves a short line alone", () => {
		expect(foldLine("SUMMARY:A first call")).toBe("SUMMARY:A first call");
	});

	it("folds ASCII at 75 octets, with the continuation space counted", () => {
		const line = `DESCRIPTION:${"a".repeat(200)}`;
		const parts = foldLine(line).split("\r\n");

		expect(parts[0]).toHaveLength(75);
		for (const part of parts.slice(1)) {
			expect(part.startsWith(" ")).toBe(true);
			expect(part.length).toBeLessThanOrEqual(75);
		}
		expect(parts.map((part, index) => (index === 0 ? part : part.slice(1))).join("")).toBe(
			line,
		);
	});

	it("counts octets, not characters, for names in Devanagari", () => {
		const line = `SUMMARY:${"प्रिया ".repeat(30)}`;
		const parts = foldLine(line).split("\r\n");

		expect(parts.length).toBeGreaterThan(1);
		for (const part of parts) {
			expect(encoder.encode(part).length).toBeLessThanOrEqual(75);
		}
		expect(unfold(foldLine(line))).toBe(line);
	});

	it("never splits a character made of two UTF-16 units", () => {
		const loneSurrogate =
			/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
		const line = `SUMMARY:${"𝒜".repeat(40)}`;
		const parts = foldLine(line).split("\r\n");

		expect(parts.length).toBeGreaterThan(1);
		for (const part of parts) {
			expect(loneSurrogate.test(part)).toBe(false);
			expect(encoder.encode(part).length).toBeLessThanOrEqual(75);
		}
	});
});
