import type { RishtaErrorCode } from "@repo/api/lib/errors";

/**
 * The API returns a stable code in `error.data.code` (packages/api/lib/errors.ts). The UI maps
 * each code to one kind, translated sentence; anything else is treated as a connection problem.
 */
export type ErrorCode = RishtaErrorCode;

interface ErrorWithData {
	data?: unknown;
	code?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function errorData(error: unknown): Record<string, unknown> {
	if (!isRecord(error)) {
		return {};
	}
	const data = (error as ErrorWithData).data;
	return isRecord(data) ? data : {};
}

export function errorCode(error: unknown): ErrorCode | null {
	const code = errorData(error).code;
	return typeof code === "string" ? (code as ErrorCode) : null;
}

/** The HTTP-ish status an ORPCError carries ("NOT_FOUND", "FORBIDDEN", …). */
export function errorStatus(error: unknown): string | null {
	if (!isRecord(error)) {
		return null;
	}
	const code = (error as ErrorWithData).code;
	return typeof code === "string" ? code : null;
}

export function errorLetterId(error: unknown): string | null {
	const letterId = errorData(error).letterId;
	return typeof letterId === "string" ? letterId : null;
}

/** Error codes that have their own sentence under `errors.*` in saas.json. */
export const KNOWN_ERROR_CODES = [
	"NOT_A_MEMBER",
	"ROLE_NOT_ALLOWED",
	"CANDIDATE_ONLY",
	"PAGE_NOT_FOUND",
	"PAGE_UNAVAILABLE",
	"PAGE_NOT_ACTIVE",
	"PAGE_CLOSED",
	"PAGE_AWAITING_CLAIM",
	"PAGE_EDIT_NOT_ALLOWED",
	"PAGE_INCOMPLETE",
	"UNDER_18",
	"EMAIL_NOT_VERIFIED",
	"LOOKING_FOR_INCOMPLETE",
	"VISIBILITY_NOT_ALLOWED",
	"PHOTO_LIMIT",
	"CLAIM_NOT_FOR_YOU",
	"ALREADY_CLAIMED",
	"LETTER_NOT_FOUND",
	"LETTER_EXISTS",
	"ALREADY_WROTE",
	"ALREADY_WROTE_TO_YOU",
	"LETTER_NOT_PENDING",
	"LETTER_WITHDRAWN",
	"LETTER_CLOSED",
	"SUGGESTION_UNEDITED",
	"CONTACT_IN_NOTE",
	"NOT_A_FIT",
	"DAILY_LIMIT",
	"NOT_ENOUGH_CREDITS",
	"MATCH_CLOSED",
	"PROPOSAL_NOT_OPEN",
	"INVALID_SLOTS",
	"NO_PHONE_ON_PAGE",
	"NO_FAMILY_CONTACT",
	"FAMILY_LINKS_NOT_ALLOWED",
	"FAMILY_LINK_LIMIT",
	"FAMILY_LINK_CLOSED",
	"RATE_LIMITED",
] as const satisfies readonly ErrorCode[];

export type KnownErrorCode = (typeof KNOWN_ERROR_CODES)[number];

export function knownErrorCode(error: unknown): KnownErrorCode | null {
	const code = errorCode(error);
	return code && (KNOWN_ERROR_CODES as readonly string[]).includes(code)
		? (code as KnownErrorCode)
		: null;
}
