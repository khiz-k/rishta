import { describe, expect, it } from "vitest";

import { createFamilyLinkToken, hashFamilyLinkToken } from "./token";

describe("createFamilyLinkToken", () => {
	it("makes a long, URL-safe token and stores only its hash", () => {
		const { token, tokenHash } = createFamilyLinkToken();

		expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
		expect(tokenHash).not.toContain(token);
		expect(hashFamilyLinkToken(token)).toBe(tokenHash);
	});

	it("never repeats a token", () => {
		const tokens = new Set(Array.from({ length: 50 }, () => createFamilyLinkToken().token));

		expect(tokens.size).toBe(50);
	});
});

describe("hashFamilyLinkToken", () => {
	it("is the SHA-256 of the token", () => {
		expect(hashFamilyLinkToken("abc")).toBe(
			"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		);
	});
});
