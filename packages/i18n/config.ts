import type { I18nConfig } from "./types";

/**
 * The app's own locales. English only: the template's de/es/fr bundles are gone (design.md
 * §17). The languages families read (Hindi, Urdu, Punjabi, Gujarati, Bengali, Tamil, Telugu)
 * arrive through the human-reviewed family bundle (`translations/family`) on the family link
 * and the sample page, and join this list only once a full human-reviewed app bundle exists.
 */
export const config = {
	locales: {
		en: {
			label: "English",
			currency: "USD",
		},
	},
	defaultLocale: "en",
	defaultCurrency: "USD",
	localeCookieName: "NEXT_LOCALE",
} as const satisfies I18nConfig;

export type Locale = keyof typeof config.locales;

/**
 * A supported locale, or the default. A stale cookie or profile value (a "de" left from the
 * template) must never make a request import a bundle that no longer exists.
 */
export function resolveLocale(value: string | null | undefined): Locale {
	return value && value in config.locales ? (value as Locale) : config.defaultLocale;
}
