/**
 * The languages families read (design.md §5.9, §13). A family link can be set in any of them;
 * each is named in its own script. A small, dependency-free module, so the family link's client
 * islands can import it without the rest of the i18n package.
 */
export const FAMILY_LANGUAGES = ["en", "hi", "ur", "pa", "gu", "bn", "ta", "te"] as const;
export type FamilyLanguage = (typeof FAMILY_LANGUAGES)[number];

/** Each language named in its own script: English · हिन्दी · اردو · ਪੰਜਾਬੀ · ગુજરાતી · বাংলা · தமிழ் · తెలుగు */
export const FAMILY_LANGUAGE_NAMES: Record<FamilyLanguage, string> = {
	en: "English",
	hi: "हिन्दी",
	ur: "اردو",
	pa: "ਪੰਜਾਬੀ",
	gu: "ગુજરાતી",
	bn: "বাংলা",
	ta: "தமிழ்",
	te: "తెలుగు",
};

export function isFamilyLanguage(value: string | null | undefined): value is FamilyLanguage {
	return typeof value === "string" && (FAMILY_LANGUAGES as readonly string[]).includes(value);
}

/** Urdu mirrors the whole page; every other family language reads left to right. */
export function familyLanguageDir(language: FamilyLanguage): "ltr" | "rtl" {
	return language === "ur" ? "rtl" : "ltr";
}
