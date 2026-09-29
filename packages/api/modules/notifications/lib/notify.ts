import { db, user } from "@repo/database";
import { logger } from "@repo/logs";
import { createNotification, NOTIFICATION_TYPES } from "@repo/notifications";
import { eq } from "drizzle-orm";

import { getServerCopy } from "../../../lib/copy";

type CopyKey =
	| "LETTER_RECEIVED"
	| "LETTER_ANSWERED_YES"
	| "LETTER_ANSWERED"
	| "CALL_PROPOSED"
	| "CALL_BOOKED"
	| "INTRODUCTION_CLOSED"
	| "FAMILY_REACTION"
	| "PAGE_CLAIMED"
	| "CLAIM_DECLINED";

const TYPE_FOR_COPY: Record<CopyKey, keyof typeof NOTIFICATION_TYPES> = {
	LETTER_RECEIVED: "LETTER_RECEIVED",
	LETTER_ANSWERED_YES: "LETTER_ANSWERED",
	LETTER_ANSWERED: "LETTER_ANSWERED",
	CALL_PROPOSED: "CALL_PROPOSED",
	CALL_BOOKED: "CALL_BOOKED",
	INTRODUCTION_CLOSED: "INTRODUCTION_CLOSED",
	FAMILY_REACTION: "FAMILY_REACTION",
	PAGE_CLAIMED: "PAGE_CLAIMED",
	CLAIM_DECLINED: "CLAIM_DECLINED",
};

/**
 * Sends a discreet notification (spec.md §10). The in-app line may name family ("Ammi left a
 * pencil note"), but the email subject and body never name anyone: the body only says
 * "Open Rishta to read it." Failures are logged and never reach the person acting.
 */
export async function notifyUser(params: {
	userId: string;
	copy: CopyKey;
	link: string;
	values?: Record<string, string>;
	email: boolean;
	data?: Record<string, string | number | boolean | null>;
}) {
	try {
		const recipient = await db.query.user.findFirst({
			where: eq(user.id, params.userId),
			columns: { locale: true },
		});
		const t = await getServerCopy(recipient?.locale);
		const values = params.values ?? {};
		const headline = t(`notifications.${params.copy}.headline`);
		const message = t(`notifications.${params.copy}.message`, values);

		await createNotification({
			userId: params.userId,
			type: NOTIFICATION_TYPES[TYPE_FOR_COPY[params.copy]],
			data: { headline, message, ...params.data },
			link: params.link,
			email: params.email
				? { title: headline, message: t("notifications.discreetBody") }
				: false,
		});
	} catch (error) {
		logger.error(error, { ctx: "notifyUser", copy: params.copy });
	}
}
