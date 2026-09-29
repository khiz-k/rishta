export { config, type Locale, resolveLocale } from "./config";
export { getMessagesForLocale } from "./lib/get-messages";
export {
	FAMILY_LANGUAGE_NAMES,
	FAMILY_LANGUAGES,
	type FamilyLanguage,
	familyLanguageDir,
	getFamilyMessages,
	isFamilyLanguage,
} from "./lib/get-family-messages";
export { default as defaultMailTranslations } from "./translations/en/mail.json";
export type { MailMessages, MarketingMessages, SaasMessages, SharedMessages } from "./types";
