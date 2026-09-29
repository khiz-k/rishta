"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import { createPageText } from "./page-text";

export { ENUM_FIELDS, type EnumField, isEnumField, type PageText } from "./page-text";

/**
 * The page's words in the reader's locale (see `createPageText`). The returned helpers keep
 * their identity while the locale and messages do, so they are safe in effect dependencies.
 */
export function usePageText() {
	const t = useTranslations("page");
	const locale = useLocale();
	return useMemo(() => createPageText(t, locale), [t, locale]);
}
