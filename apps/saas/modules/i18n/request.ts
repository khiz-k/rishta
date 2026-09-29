import { config as i18nConfig, resolveLocale } from "@repo/i18n";
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import { getMessagesForLocale } from "./lib/messages";

export default getRequestConfig(async ({ requestLocale }) => {
	let requested = await requestLocale;

	if (!requested) {
		const cookieStore = await cookies();
		requested = cookieStore.get(i18nConfig.localeCookieName)?.value;
	}

	// English only today: an old "de"/"es"/"fr" cookie falls back instead of failing the request.
	const locale = resolveLocale(requested);

	return {
		locale,
		messages: await getMessagesForLocale(locale),
	};
});
