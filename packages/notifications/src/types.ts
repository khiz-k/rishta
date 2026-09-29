/**
 * The notification types Rishta sends. The database enum still carries the template's `WELCOME`
 * value, but nothing creates it: there is no notices surface (design.md §4.1), and the first thing
 * a new account receives is the email asking them to confirm their address.
 */
export const NOTIFICATION_TYPES = {
	APP_UPDATE: "APP_UPDATE",
	LETTER_RECEIVED: "LETTER_RECEIVED",
	LETTER_ANSWERED: "LETTER_ANSWERED",
	CALL_PROPOSED: "CALL_PROPOSED",
	CALL_BOOKED: "CALL_BOOKED",
	INTRODUCTION_CLOSED: "INTRODUCTION_CLOSED",
	FAMILY_REACTION: "FAMILY_REACTION",
	CLAIM_REQUESTED: "CLAIM_REQUESTED",
	PAGE_CLAIMED: "PAGE_CLAIMED",
	CLAIM_DECLINED: "CLAIM_DECLINED",
	FOLIO_READY: "FOLIO_READY",
} as const;

export type { NotificationTarget, NotificationType } from "@repo/database";
