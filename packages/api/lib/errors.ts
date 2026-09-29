import { ORPCError } from "@orpc/server";

/**
 * Stable error codes returned in `error.data.code`. The UI maps each to a translated, kind
 * sentence; the message is the code itself so logs stay readable. A code never tells a
 * stranger that a household or a record exists: an unknown household answers `NOT_A_MEMBER`, a
 * claim that is not yours answers `CLAIM_NOT_FOR_YOU`, and a record looked up by id (a photo, a
 * folio page, a pencil note, a family link, a letter, an introduction) answers its own
 * `*_NOT_FOUND` whether it is missing or another household's (`getHouseholdRow`; quality rule S1).
 */
export type RishtaErrorCode =
	| "NOT_A_MEMBER"
	| "ROLE_NOT_ALLOWED"
	| "CANDIDATE_ONLY"
	| "PAGE_NOT_FOUND"
	| "PAGE_UNAVAILABLE"
	| "PAGE_NOT_ACTIVE"
	| "PAGE_CLOSED"
	| "PAGE_AWAITING_CLAIM"
	| "PAGE_EDIT_NOT_ALLOWED"
	| "PAGE_INCOMPLETE"
	| "UNDER_18"
	| "EMAIL_NOT_VERIFIED"
	| "LOOKING_FOR_INCOMPLETE"
	| "VISIBILITY_NOT_ALLOWED"
	| "PHOTO_LIMIT"
	| "PHOTO_NOT_FOUND"
	| "INVALID_STORAGE_KEY"
	| "INVALID_TIME_ZONE"
	| "CLAIM_NOT_FOR_YOU"
	| "ALREADY_CLAIMED"
	| "LETTER_NOT_FOUND"
	| "LETTER_EXISTS"
	| "ALREADY_WROTE"
	| "ALREADY_WROTE_TO_YOU"
	| "LETTER_NOT_PENDING"
	| "LETTER_WITHDRAWN"
	| "LETTER_CLOSED"
	| "SUGGESTION_UNEDITED"
	| "CONTACT_IN_NOTE"
	| "NOT_A_FIT"
	| "DAILY_LIMIT"
	| "NOT_ENOUGH_CREDITS"
	| "MATCH_NOT_FOUND"
	| "MATCH_CLOSED"
	| "PROPOSAL_NOT_FOUND"
	| "PROPOSAL_NOT_OPEN"
	| "INVALID_SLOTS"
	| "NO_PHONE_ON_PAGE"
	| "NO_FAMILY_CONTACT"
	| "FOLIO_PAGE_NOT_FOUND"
	| "FOLIO_LOCKED"
	| "FAMILY_LINKS_NOT_ALLOWED"
	| "FAMILY_LINK_LIMIT"
	| "FAMILY_LINK_NOT_FOUND"
	| "FAMILY_LINK_CLOSED"
	| "NOTE_NOT_FOUND"
	| "REPORT_NOT_FOUND"
	| "REPORT_CONTEXT_NOT_FOUND"
	| "RATE_LIMITED"
	| "SLUG_UNAVAILABLE";

type ErrorStatus =
	| "BAD_REQUEST"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "CONFLICT"
	| "PRECONDITION_FAILED"
	| "TOO_MANY_REQUESTS"
	| "INTERNAL_SERVER_ERROR";

export function fail(
	status: ErrorStatus,
	code: RishtaErrorCode,
	data: Record<string, string | number | boolean | null> = {},
): never {
	throw new ORPCError(status, { message: code, data: { code, ...data } });
}
