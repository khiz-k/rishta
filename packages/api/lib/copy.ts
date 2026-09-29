import { getMessagesForLocale, type MailMessages, resolveLocale } from "@repo/i18n";
import { createTranslator } from "use-intl/core";

/**
 * Server-side copy (notification text, default notes, first-line templates, share text) lives in
 * the `rishta` namespace of the mail bundle, so nothing user-facing is hard-coded in English.
 */
export async function getServerCopy(locale?: string | null) {
	const resolved = resolveLocale(locale);
	const messages = await getMessagesForLocale<MailMessages>(resolved, "mail");
	return createTranslator({ locale: resolved, messages, namespace: "rishta" });
}

export type ServerCopy = Awaited<ReturnType<typeof getServerCopy>>;
