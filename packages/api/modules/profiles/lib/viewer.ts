import {
	getPageByHandle,
	getPreferenceByOrganizationId,
	isBlockedEitherWay,
	normalizeHandle,
} from "@repo/database";

import { fail } from "../../../lib/errors";
import type { PageWithPhotos } from "../../biodata/lib/page-view";
import { resolveRelationship, type RelationshipResult } from "../../biodata/lib/relationship";
import { evaluateFit, selectReasons } from "../../folio/lib/fit";
import {
	canReadFolio,
	letterReaderUserId,
	type HouseholdContext,
} from "../../households/lib/context";

/**
 * Loads another page for a reader household, applying every access rule (spec.md §8
 * `profiles.getPage`, §13): 404 if blocked in either direction, unclaimed, or not active
 * (unless it is the household's own page or an introduction). Another household's page is
 * read only by those who may read the folio (`familyReadsFolio`), and its relationship comes
 * from the candidate's letters only when the candidate is the reader: a guardian or family
 * member gets the stranger's view and no letters (`letterReaderUserId`).
 */
export async function loadPageForViewer(
	context: HouseholdContext,
	handle: string,
): Promise<{ page: PageWithPhotos; relation: RelationshipResult }> {
	const page = await getPageByHandle(normalizeHandle(handle));
	if (!page) {
		fail("NOT_FOUND", "PAGE_NOT_FOUND");
	}

	const candidateUserId = context.page?.userId ?? null;
	const relation = await resolveRelationship({
		viewerUserId: context.userId,
		viewerOrganizationId: context.organizationId,
		viewerCandidateUserId: letterReaderUserId(context),
		target: page,
	});

	if (relation.relationship === "self" || relation.relationship === "household") {
		return { page, relation };
	}

	// Visibility first, folio access last: a page this household could not see answers like a
	// missing one, even to a relative the folio is closed to (quality rule S1).
	if (!page.userId || page.status === "awaiting_claim") {
		fail("NOT_FOUND", "PAGE_NOT_FOUND");
	}
	const blockChecks = [isBlockedEitherWay(context.userId, page.userId)];
	if (candidateUserId && candidateUserId !== context.userId) {
		blockChecks.push(isBlockedEitherWay(candidateUserId, page.userId));
	}
	if ((await Promise.all(blockChecks)).some(Boolean)) {
		fail("NOT_FOUND", "PAGE_NOT_FOUND");
	}
	if (page.status !== "active" && relation.relationship !== "introduced") {
		fail("NOT_FOUND", "PAGE_NOT_FOUND");
	}
	if (!canReadFolio(context)) {
		fail("FORBIDDEN", "ROLE_NOT_ALLOWED");
	}

	return { page, relation };
}

/** The reader household's own "Why this page" reasons for another page, computed live. */
export async function reasonsForViewer(context: HouseholdContext, target: PageWithPhotos) {
	if (!context.page || target.organizationId === context.organizationId) {
		return [];
	}
	const [readerPreference, targetPreference] = await Promise.all([
		getPreferenceByOrganizationId(context.organizationId),
		getPreferenceByOrganizationId(target.organizationId),
	]);
	if (!readerPreference) {
		return [];
	}
	const reasons = evaluateFit(
		{ page: context.page, preference: readerPreference },
		{
			page: target,
			preference: targetPreference ?? null,
			photoVisibilities: target.photos.map((photo) => photo.visibility),
		},
	);
	return selectReasons(reasons, readerPreference.dealbreakers);
}
