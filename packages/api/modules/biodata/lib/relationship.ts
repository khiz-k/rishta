import { getLettersBetweenUsers, type InterestRow, type MatchRow } from "@repo/database";

import type { PageRelationship } from "../types";
import type { PageWithPhotos } from "./page-view";

export interface RelationshipResult {
	relationship: PageRelationship;
	/** The viewer's candidate wrote to this page. */
	myLetter: (InterestRow & { match: MatchRow | null }) | null;
	/** This page's candidate wrote to the viewer's candidate. */
	theirLetter: (InterestRow & { match: MatchRow | null }) | null;
	match: MatchRow | null;
}

/**
 * Who a page is to the reader: their own, their household's, an introduction, a letter in either
 * direction, or a stranger. Drives what the redaction layer opens.
 */
export async function resolveRelationship(params: {
	viewerUserId: string;
	viewerOrganizationId: string;
	viewerCandidateUserId: string | null;
	target: PageWithPhotos;
}): Promise<RelationshipResult> {
	const { target } = params;
	const empty = { myLetter: null, theirLetter: null, match: null };

	if (target.userId && target.userId === params.viewerUserId) {
		return { relationship: "self", ...empty };
	}
	if (target.organizationId === params.viewerOrganizationId) {
		return { relationship: "household", ...empty };
	}
	if (!params.viewerCandidateUserId || !target.userId) {
		return { relationship: "stranger", ...empty };
	}

	const letters = await getLettersBetweenUsers(params.viewerCandidateUserId, target.userId);
	const myLetter =
		letters.find((letter) => letter.fromUserId === params.viewerCandidateUserId) ?? null;
	const theirLetter = letters.find((letter) => letter.fromUserId === target.userId) ?? null;
	const match = myLetter?.match ?? theirLetter?.match ?? null;

	return {
		relationship: relationshipFromLetters({ myLetter, theirLetter, match }),
		myLetter,
		theirLetter,
		match,
	};
}

export function relationshipFromLetters(params: {
	myLetter: InterestRow | null;
	theirLetter: InterestRow | null;
	match: MatchRow | null;
}): PageRelationship {
	if (params.match) {
		return "introduced";
	}
	if (params.theirLetter) {
		return "wrote_to_me";
	}
	if (params.myLetter) {
		return "i_wrote";
	}
	return "stranger";
}
