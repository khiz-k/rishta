import {
	countExposuresSince,
	db,
	folio,
	folioPage,
	getBlockedUserIdsEitherWay,
	getFolioForDate,
	getFolioHistory,
	getFolioPool,
	getKeptProfileUserIds,
	getLetterPartnerIds,
	type FitReason,
	type PartnerPreferenceRow,
} from "@repo/database";

import { DAY_MS } from "../../../lib/time";
import type { PageWithPhotos } from "../../biodata/lib/page-view";
import {
	dailyTiebreak,
	evaluateFit,
	EXPOSURE_CAP_PER_DAY,
	isMutuallyEligible,
	MAX_PRIOR_APPEARANCES,
	PASS_COOLDOWN_DAYS,
	RESURFACE_AFTER_DAYS,
	scoreFit,
	selectReasons,
	type FitSide,
} from "./fit";

interface GenerateFolioParams {
	organizationId: string;
	page: PageWithPhotos;
	preference: PartnerPreferenceRow;
	releaseDate: string;
	size: number;
	now?: Date;
}

interface Candidate {
	profileId: string;
	reasons: FitReason[];
	score: number;
	tiebreak: number;
	seenBefore: boolean;
}

/**
 * Builds a household's folio for a release date (spec.md §7). Generated lazily on the first
 * `folio.today` after release; concurrent calls converge on the unique (household, date).
 */
export async function generateFolio(params: GenerateFolioParams) {
	const now = params.now ?? new Date();
	const { page, preference, organizationId } = params;

	if (!page.userId || !page.gender) {
		return null;
	}

	const pool = await getFolioPool({
		excludeOrganizationId: organizationId,
		gender: preference.seeking,
		seekingGender: page.gender,
	});

	const profileIds = pool.map((row) => row.profile.id);
	const startOfUtcDay = new Date(Math.floor(now.getTime() / DAY_MS) * DAY_MS);

	const [blocked, letterPartners, kept, history, exposures] = await Promise.all([
		getBlockedUserIdsEitherWay(page.userId),
		getLetterPartnerIds(page.userId),
		getKeptProfileUserIds(organizationId),
		getFolioHistory(organizationId, profileIds),
		countExposuresSince(profileIds, startOfUtcDay),
	]);

	const reader: FitSide = { page, preference };
	const candidates: Candidate[] = [];

	for (const row of pool) {
		const target = row.profile;
		if (!target.userId) {
			continue;
		}
		// Rule 3: no block and no letter in either direction; kept pages live in Kept pages.
		if (
			blocked.has(target.userId) ||
			letterPartners.has(target.userId) ||
			kept.has(target.userId)
		) {
			continue;
		}

		// Rule 4: history with this household.
		const appearances = history.filter((entry) => entry.profileId === target.id);
		const passedRecently = appearances.some(
			(entry) =>
				entry.state === "passed" &&
				(entry.answeredAt ?? entry.createdAt).getTime() >
					now.getTime() - PASS_COOLDOWN_DAYS * DAY_MS,
		);
		const answered = appearances.some(
			(entry) => entry.state === "kept" || entry.state === "noted",
		);
		const lastSeen = appearances.reduce<number>(
			(latest, entry) => Math.max(latest, entry.createdAt.getTime()),
			0,
		);
		if (
			passedRecently ||
			answered ||
			appearances.length > MAX_PRIOR_APPEARANCES ||
			(lastSeen > 0 && lastSeen > now.getTime() - RESURFACE_AFTER_DAYS * DAY_MS)
		) {
			continue;
		}

		// Rule 6: the exposure cap spreads attention so popular pages are not flooded.
		if ((exposures.get(target.id) ?? 0) >= EXPOSURE_CAP_PER_DAY) {
			continue;
		}

		const side: FitSide = {
			page: target,
			preference: row.preference,
			photoVisibilities: row.photoVisibilities,
		};

		// Rule 5: mutual dealbreakers.
		if (!isMutuallyEligible(reader, side, now)) {
			continue;
		}

		const reasons = evaluateFit(reader, side, now);
		candidates.push({
			profileId: target.id,
			reasons: selectReasons(reasons, preference.dealbreakers),
			score: scoreFit(reasons, reader, side, now),
			tiebreak: dailyTiebreak(organizationId, target.id, params.releaseDate),
			seenBefore: appearances.length > 0,
		});
	}

	candidates.sort((a, b) => b.score - a.score || a.tiebreak - b.tiebreak);
	const chosen = candidates.slice(0, params.size);

	await db.transaction(async (tx) => {
		const [created] = await tx
			.insert(folio)
			.values({
				organizationId,
				releaseDate: params.releaseDate,
				size: params.size,
				generatedAt: now,
			})
			.onConflictDoNothing({ target: [folio.organizationId, folio.releaseDate] })
			.returning();

		if (!created || chosen.length === 0) {
			return;
		}

		await tx.insert(folioPage).values(
			chosen.map((candidate, index) => ({
				folioId: created.id,
				organizationId,
				profileId: candidate.profileId,
				position: index + 1,
				reasons: candidate.reasons,
				score: candidate.score,
				seenBefore: candidate.seenBefore,
			})),
		);
	});

	return getFolioForDate(organizationId, params.releaseDate);
}
