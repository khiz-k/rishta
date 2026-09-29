import type { PageView } from "@shared/lib/api-types";
import {
	firstNameOf,
	formatBirthDate,
	formatFeetInches,
	formatHeight,
	formatMonthYear,
	formatShortDate,
} from "@shared/lib/format";
import type { useTranslations } from "next-intl";

/** Fields whose stored value is an enum key, rendered through `page.values.<field>.<value>`. */
export const ENUM_FIELDS = [
	"gender",
	"maritalStatus",
	"hasChildren",
	"religion",
	"practice",
	"residency",
	"manglik",
	"education",
	"incomeRange",
	"familyType",
	"familyValues",
	"diet",
	"smoking",
	"drinking",
] as const;
export type EnumField = (typeof ENUM_FIELDS)[number];

export function isEnumField(key: string): key is EnumField {
	return (ENUM_FIELDS as readonly string[]).includes(key);
}

/** The `page` namespace translator: `useTranslations("page")` or a server `createTranslator`. */
export type PageTranslator = ReturnType<typeof useTranslations<"page">>;

/**
 * Turns a page's stored values into the words a family reads: "June 1994", "5′10″ (178 cm)",
 * "Never married", "Punjabi, Hindi, English". Labels and enum words come from the `page`
 * bundle, which the family link also carries in the reader's own language.
 *
 * Pure (no hooks), so the family link can set a whole page on the server in Ammi's language
 * (design.md §5.9) and the reader can do the same on the client through `usePageText`.
 */
export function createPageText(t: PageTranslator, locale: string) {
	const label = (key: string) => {
		const path = `fields.${key}` as Parameters<typeof t>[0];
		return t.has(path) ? t(path) : key;
	};

	const enumValue = (field: EnumField, value: string) => {
		const path = `values.${field}.${value}` as Parameters<typeof t>[0];
		return t.has(path) ? t(path) : value;
	};

	const value = (key: string, raw: string | string[]) => {
		if (Array.isArray(raw)) {
			return raw.join(", ");
		}
		switch (key) {
			case "born":
				return formatMonthYear(raw, locale);
			case "dateOfBirth":
				return formatBirthDate(raw, locale);
			case "height": {
				const cm = Number(raw);
				return Number.isFinite(cm) ? formatHeight(cm) : raw;
			}
			default:
				return isEnumField(key) ? enumValue(key, raw) : raw;
		}
	};

	/** "32 · 5′10″ · Toronto, Ontario" */
	const headerMeta = (header: PageView["header"]) => {
		const parts: string[] = [];
		if (header.age !== null) {
			parts.push(String(header.age));
		}
		if (header.heightCm) {
			parts.push(formatFeetInches(header.heightCm));
		}
		if (header.city) {
			parts.push(header.city);
		}
		return parts.join(" · ");
	};

	const signer = (header: PageView["header"]) => {
		const name = header.signer.candidateFirstName || firstNameOf(header.displayName);
		const { createdBy, confirmedByCandidate } = header.signer;
		if (createdBy === "self") {
			return t("signer.self", { name });
		}
		return confirmedByCandidate
			? t(`signer.${createdBy}Confirmed`, { name })
			: t(`signer.${createdBy}`, { name });
	};

	const verification = (level: PageView["header"]["verification"]) =>
		level === "none" ? null : t(`verified.${level}`);

	const ref = (page: Pick<PageView, "ref" | "updatedAt">) =>
		t("ref", { ref: page.ref, date: formatShortDate(page.updatedAt, locale) });

	return { t, label, value, enumValue, headerMeta, signer, verification, ref, locale };
}

export type PageText = ReturnType<typeof createPageText>;
