import { createHash, randomBytes } from "node:crypto";

/** A 32-byte random token for `/f/[token]`; only its SHA-256 hash is ever stored. */
export function createFamilyLinkToken() {
	const token = randomBytes(32).toString("base64url");
	return { token, tokenHash: hashFamilyLinkToken(token) };
}

export function hashFamilyLinkToken(token: string) {
	return createHash("sha256").update(token).digest("hex");
}
