import type { SaasMessages } from "@repo/i18n";

/**
 * next-intl 4 reads message types from `AppConfig` (the global `IntlMessages` of v3 is ignored),
 * so every `t("…")` key, including template-literal keys, is checked against the English bundle.
 */
declare module "next-intl" {
	interface AppConfig {
		Messages: SaasMessages;
	}
}
