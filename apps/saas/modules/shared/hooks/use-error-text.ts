"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import { knownErrorCode } from "../lib/errors";

/** One kind, translated sentence per API error code; anything else reads as a connection issue. */
export function useErrorText() {
	const t = useTranslations("errors");
	return useCallback(
		(error: unknown) => {
			const code = knownErrorCode(error);
			return code ? t(code) : t("generic");
		},
		[t],
	);
}
