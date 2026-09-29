import { randomInt } from "node:crypto";

import { config as authConfig } from "@repo/auth/config";
import { getOrganizationBySlug } from "@repo/database";
import slugify from "@sindresorhus/slugify";

import { fail } from "../../../lib/errors";

const SUFFIX_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function randomSuffix(length: number) {
	let suffix = "";
	for (let i = 0; i < length; i++) {
		suffix += SUFFIX_ALPHABET.charAt(randomInt(SUFFIX_ALPHABET.length));
	}
	return suffix;
}

/**
 * A neutral household slug: the first name plus 3 random characters ("priya-k3m"), never a
 * full name, and never a top-level route word.
 */
export async function generateHouseholdSlug(firstName: string) {
	const base =
		slugify(firstName.split(/\s+/)[0] ?? "", { lowercase: true }).slice(0, 20) || "page";
	const forbidden: readonly string[] = authConfig.organizations.forbiddenOrganizationSlugs;

	for (let attempt = 0; attempt < 6; attempt++) {
		const slug = `${base}-${randomSuffix(attempt < 3 ? 3 : 5)}`;
		if (forbidden.includes(slug)) {
			continue;
		}
		const existing = await getOrganizationBySlug(slug);
		if (!existing) {
			return slug;
		}
	}

	fail("CONFLICT", "SLUG_UNAVAILABLE");
}
