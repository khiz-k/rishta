import type { BiodataProfileRow, PartnerPreferenceRow } from "@repo/database";
// The domain module has no side effects (no DB client), so these pure functions stay testable.
import {
	resolveFieldVisibility,
	TIMELINES,
	type FitKey,
	type FitReason,
	type PhotoVisibility,
} from "@repo/database/drizzle/domain";

import { ageFromDateOfBirth, daysBetween } from "../../../lib/time";

/**
 * Deterministic fit (spec.md §7). Pure functions only: no I/O, no AI. The client never sees a
 * score; it sees 2-6 plain reasons with honest gaps.
 */

export type FitPage = Pick<
	BiodataProfileRow,
	| "gender"
	| "dateOfBirth"
	| "height"
	| "religion"
	| "diet"
	| "maritalStatus"
	| "education"
	| "profession"
	| "community"
	| "motherTongue"
	| "languages"
	| "location"
	| "country"
	| "residency"
	| "nativePlace"
	| "aboutMe"
	| "lookingFor"
	| "fieldVisibility"
	| "publishedAt"
>;

export type FitPreference = Pick<
	PartnerPreferenceRow,
	| "seeking"
	| "marriageTimeline"
	| "relocation"
	| "residencyRequirement"
	| "ageMin"
	| "ageMax"
	| "heightMin"
	| "heightMax"
	| "religions"
	| "communities"
	| "educationLevels"
	| "locations"
	| "countries"
	| "diet"
	| "maritalStatus"
	| "dealbreakers"
	| "valuesLooks"
	| "valuesPersonality"
	| "valuesFinancial"
>;

export interface FitSide {
	page: FitPage;
	preference: FitPreference | null;
	/** Visibilities of the page's photos, for the looks tie-breaker. */
	photoVisibilities?: PhotoVisibility[];
}

/** Reads at most this many reasons into "Why this page". */
export const MAX_REASONS = 6;
/** A page may appear in at most this many folios per day (an assumption, spec.md §17). */
export const EXPOSURE_CAP_PER_DAY = 40;
export const PASS_COOLDOWN_DAYS = 90;
export const RESURFACE_AFTER_DAYS = 3;
/** An unanswered page may come back at most once. */
export const MAX_PRIOR_APPEARANCES = 1;
const RECENTLY_PUBLISHED_DAYS = 14;

function fits(key: FitKey, params: Record<string, string> = {}): FitReason {
	return { key, verdict: "fits", params };
}

function gap(key: FitKey, params: Record<string, string> = {}): FitReason {
	return { key, verdict: "gap", params };
}

function unknown(key: FitKey, params: Record<string, string> = {}): FitReason {
	return { key, verdict: "unknown", params };
}

function norm(value: string) {
	return value.trim().toLowerCase();
}

function cityOf(location: string | null) {
	return location ? norm(location.split(",")[0] ?? location) : null;
}

/** Reveals a special-category value in copy only if the page shows it. */
function shownValue(
	page: FitPage,
	field: "religion" | "community" | "education",
	value: string | null,
): Record<string, string> {
	if (!value) {
		return {};
	}
	return resolveFieldVisibility(page.fieldVisibility, field) === "page" ? { value } : {};
}

function spokenLanguages(page: FitPage) {
	const list = [page.motherTongue, ...page.languages].filter(
		(language): language is string =>
			typeof language === "string" && language.trim().length > 0,
	);
	return list;
}

/**
 * Evaluates one key from the reader's point of view: does `target` fit what `reader` asked for?
 * Returns null when the reader stated nothing for the key (it is then neither shown nor a
 * dealbreaker failure).
 */
export function evaluateFitKey(
	key: FitKey,
	reader: FitSide,
	target: FitSide,
	now: Date = new Date(),
): FitReason | null {
	const wants = reader.preference;
	const page = target.page;

	switch (key) {
		case "timeline": {
			const mine = wants?.marriageTimeline ?? null;
			const theirs = target.preference?.marriageTimeline ?? null;
			if (!mine || !theirs) {
				return unknown(key, mine ? { mine } : {});
			}
			const distance = Math.abs(TIMELINES.indexOf(mine) - TIMELINES.indexOf(theirs));
			const params = { mine, theirs, same: mine === theirs ? "true" : "false" };
			return distance <= 1 ? fits(key, params) : gap(key, params);
		}
		case "religion": {
			if (!wants || wants.religions.length === 0) {
				return null;
			}
			if (!page.religion) {
				return unknown(key);
			}
			const params = shownValue(page, "religion", page.religion);
			return wants.religions.includes(page.religion) ? fits(key, params) : gap(key, params);
		}
		case "diet": {
			if (!wants || wants.diet.length === 0) {
				return null;
			}
			const params = { theirs: page.diet, mine: reader.page.diet };
			return wants.diet.includes(page.diet) ? fits(key, params) : gap(key, params);
		}
		case "age": {
			if (!wants || (wants.ageMin === null && wants.ageMax === null)) {
				return null;
			}
			if (!page.dateOfBirth) {
				return unknown(key);
			}
			const age = ageFromDateOfBirth(page.dateOfBirth, now);
			const within =
				(wants.ageMin === null || age >= wants.ageMin) &&
				(wants.ageMax === null || age <= wants.ageMax);
			return within ? fits(key, { age: String(age) }) : gap(key, { age: String(age) });
		}
		case "marital_status": {
			if (!wants || wants.maritalStatus.length === 0) {
				return null;
			}
			const params = { status: page.maritalStatus };
			return wants.maritalStatus.includes(page.maritalStatus)
				? fits(key, params)
				: gap(key, params);
		}
		case "location":
			return evaluateLocation(reader, target);
		case "residency": {
			if (wants?.residencyRequirement !== "citizen_or_pr") {
				return null;
			}
			// The status itself is never put into copy (it is matching-only by default).
			if (!page.residency) {
				return unknown(key);
			}
			return page.residency === "citizen" || page.residency === "permanent_resident"
				? fits(key)
				: gap(key);
		}
		case "education": {
			if (!wants || wants.educationLevels.length === 0) {
				return null;
			}
			if (!page.education) {
				return unknown(key);
			}
			const params = shownValue(page, "education", page.education);
			return wants.educationLevels.includes(page.education)
				? fits(key, params)
				: gap(key, params);
		}
		case "community": {
			if (!wants || wants.communities.length === 0) {
				return null;
			}
			if (!page.community) {
				return unknown(key, { stated: "false" });
			}
			const params = shownValue(page, "community", page.community);
			const listed = wants.communities.map(norm);
			return listed.includes(norm(page.community)) ? fits(key, params) : gap(key, params);
		}
		case "language": {
			// Fits only; a missing shared language is never a gap.
			const theirs = spokenLanguages(page);
			const mine = new Set(spokenLanguages(reader.page).map(norm));
			const shared = theirs.find((language) => mine.has(norm(language)));
			return shared ? fits(key, { language: shared }) : null;
		}
		case "height": {
			if (!wants || (wants.heightMin === null && wants.heightMax === null)) {
				return null;
			}
			if (page.height === null) {
				return unknown(key);
			}
			const within =
				(wants.heightMin === null || page.height >= wants.heightMin) &&
				(wants.heightMax === null || page.height <= wants.heightMax);
			const params = { heightCm: String(page.height) };
			return within ? fits(key, params) : gap(key, params);
		}
	}
}

function evaluateLocation(reader: FitSide, target: FitSide): FitReason {
	const key: FitKey = "location";
	const wants = reader.preference;
	const page = target.page;
	const readerCity = reader.page.location ?? "";
	const places = (wants?.locations ?? []).map(norm).filter((place) => place.length > 0);
	const countries = (wants?.countries ?? []).map((country) => country.toUpperCase());

	const placeMatch =
		(page.location !== null &&
			places.some((place) => norm(page.location ?? "").includes(place))) ||
		(page.country !== null && countries.includes(page.country.toUpperCase()));
	if (placeMatch) {
		return fits(key, { basis: "place", readerCity });
	}

	const theirRelocation = target.preference?.relocation ?? null;
	const myRelocation = wants?.relocation ?? null;
	if (theirRelocation === "open") {
		return fits(key, { basis: "they_relocate", readerCity });
	}
	if (myRelocation === "open") {
		return fits(key, { basis: "you_relocate", readerCity });
	}

	const myCountry = reader.page.country?.toUpperCase() ?? null;
	const theirCountry = page.country?.toUpperCase() ?? null;
	if (!myCountry || !theirCountry) {
		return unknown(key);
	}

	const myCity = cityOf(reader.page.location);
	const theirCity = cityOf(page.location);
	if (myCountry === theirCountry && myCity && theirCity && myCity === theirCity) {
		return fits(key, { basis: "same_city", readerCity });
	}
	if (myCountry !== theirCountry) {
		return gap(key, { basis: "different_country", readerCity });
	}
	if (myRelocation === "within_country" || theirRelocation === "within_country") {
		return fits(key, { basis: "same_country", readerCity });
	}
	if (myRelocation === null && theirRelocation === null) {
		return unknown(key);
	}
	return gap(key, { basis: "different_city", readerCity });
}

/** Every applicable reason for `target` from `reader`'s point of view. */
export function evaluateFit(reader: FitSide, target: FitSide, now: Date = new Date()) {
	const reasons: FitReason[] = [];
	for (const key of [
		"timeline",
		"religion",
		"diet",
		"age",
		"marital_status",
		"location",
		"residency",
		"education",
		"community",
		"language",
		"height",
	] as const) {
		const reason = evaluateFitKey(key, reader, target, now);
		if (reason) {
			reasons.push(reason);
		}
	}
	return reasons;
}

/** True when none of `reader`'s dealbreakers is a gap for `target` (fits or unknown pass). */
export function passesDealbreakers(reader: FitSide, target: FitSide, now: Date = new Date()) {
	const dealbreakers = reader.preference?.dealbreakers ?? [];
	return dealbreakers.every((key) => evaluateFitKey(key, reader, target, now)?.verdict !== "gap");
}

/**
 * Mutual dealbreakers (§7 rule 5): the reader's dealbreakers hold for the target and the
 * target's hold for the reader, so nobody is shown to, or written to by, people their own
 * dealbreakers exclude.
 */
export function isMutuallyEligible(reader: FitSide, target: FitSide, now: Date = new Date()) {
	return passesDealbreakers(reader, target, now) && passesDealbreakers(target, reader, now);
}

/** 2-6 reasons: the reader's dealbreakers first, then gaps, then fits, then unknowns. */
export function selectReasons(reasons: FitReason[], dealbreakers: readonly FitKey[]) {
	const rank = (reason: FitReason) => {
		if (dealbreakers.includes(reason.key)) {
			return 0;
		}
		if (reason.verdict === "gap") {
			return 1;
		}
		if (reason.verdict === "fits") {
			return 2;
		}
		return 3;
	};
	return [...reasons]
		.map((reason, index) => ({ reason, index }))
		.sort((a, b) => rank(a.reason) - rank(b.reason) || a.index - b.index)
		.slice(0, MAX_REASONS)
		.map(({ reason }) => reason);
}

/**
 * The internal ordering score, stored ×10 as an integer and never returned to any client.
 * +3 per nice-to-have that fits, −2 per gap; values-budget tie-breakers; +1 if recently
 * published. There is no paid placement of any kind.
 */
export function scoreFit(
	reasons: FitReason[],
	reader: FitSide,
	target: FitSide,
	now: Date = new Date(),
) {
	const dealbreakers = reader.preference?.dealbreakers ?? [];
	let score = 0;

	for (const reason of reasons) {
		if (dealbreakers.includes(reason.key)) {
			continue;
		}
		if (reason.verdict === "fits") {
			score += 3;
		} else if (reason.verdict === "gap") {
			score -= 2;
		}
	}

	const values = reader.preference;
	const page = target.page;
	if (values?.valuesFinancial && page.education && page.profession) {
		score += values.valuesFinancial * 0.5;
	}
	if (
		values?.valuesPersonality &&
		(page.aboutMe?.length ?? 0) + (page.lookingFor?.length ?? 0) > 300
	) {
		score += values.valuesPersonality * 0.5;
	}
	if (
		values?.valuesLooks &&
		(target.photoVisibilities ?? []).some(
			(visibility) => visibility === "everyone" || visibility === "after_note",
		)
	) {
		score += values.valuesLooks * 0.5;
	}
	if (page.publishedAt && daysBetween(page.publishedAt, now) <= RECENTLY_PUBLISHED_DAYS) {
		score += 1;
	}

	return Math.round(score * 10);
}

/** A stable daily tiebreak (FNV-1a) of household, page and date, so equal pages rotate fairly. */
export function dailyTiebreak(organizationId: string, profileId: string, releaseDate: string) {
	const input = `${organizationId}|${profileId}|${releaseDate}`;
	let hash = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return hash;
}
