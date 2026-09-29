/** Section id for i18n (`settings.notificationsPage.groups.${id}`) and ordering. */
export type NotificationGroupId = "letters" | "family" | "folio" | "general";

/**
 * The Prisma `NotificationType` values Rishta sends; keep in sync with the schema. The enum's
 * retired `WELCOME` value is left out on purpose, so it can't reach the preferences list.
 */
export type NotificationTypeId =
	| "APP_UPDATE"
	| "LETTER_RECEIVED"
	| "LETTER_ANSWERED"
	| "CALL_PROPOSED"
	| "CALL_BOOKED"
	| "INTRODUCTION_CLOSED"
	| "FAMILY_REACTION"
	| "CLAIM_REQUESTED"
	| "PAGE_CLAIMED"
	| "CLAIM_DECLINED"
	| "FOLIO_READY";

export interface NotificationGroupConfig {
	id: NotificationGroupId;
	/** Notification types in this section, in display order. */
	types: readonly NotificationTypeId[];
}

/**
 * Ordered groups for the notification preferences UI.
 * Reorder this list or the `types` arrays to change settings layout without DB migrations.
 */
export const NOTIFICATION_GROUPS: readonly NotificationGroupConfig[] = [
	{
		id: "letters",
		types: [
			"LETTER_RECEIVED",
			"LETTER_ANSWERED",
			"CALL_PROPOSED",
			"CALL_BOOKED",
			"INTRODUCTION_CLOSED",
		],
	},
	{
		id: "family",
		types: ["FAMILY_REACTION", "PAGE_CLAIMED", "CLAIM_DECLINED"],
	},
	{
		id: "folio",
		types: ["FOLIO_READY"],
	},
	{
		id: "general",
		types: ["APP_UPDATE"],
	},
];

/**
 * Types whose email is off unless the person asks for it (spec.md §10): no painful emails at
 * 11 p.m., and no email for every family reaction.
 */
export const EMAIL_OFF_BY_DEFAULT: readonly NotificationTypeId[] = [
	"FAMILY_REACTION",
	"FOLIO_READY",
];
