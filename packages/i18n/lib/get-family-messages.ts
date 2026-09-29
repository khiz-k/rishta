/**
 * The family link's own bundle (design.md §13): the `page` labels and the `family` link copy in
 * the languages families read. English comes from the saas bundle; these files overlay it, so
 * a missing string falls back to English rather than to a key.
 */
import type { FamilyLanguage } from "./family-languages";

export {
	FAMILY_LANGUAGE_NAMES,
	FAMILY_LANGUAGES,
	type FamilyLanguage,
	familyLanguageDir,
	isFamilyLanguage,
} from "./family-languages";

export async function getFamilyMessages(
	language: FamilyLanguage,
): Promise<Record<string, unknown> | null> {
	if (language === "en") {
		return null;
	}
	return (await import(`../translations/family/${language}.json`)).default as Record<
		string,
		unknown
	>;
}
