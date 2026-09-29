"use client";

import { Button } from "@repo/ui/components/button";
import { useCookieConsent } from "@shared/hooks/cookie-consent";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/** A flat paper slip, bottom left. Two plain answers; declining costs nothing. */
export function ConsentBanner() {
	const t = useTranslations("consent");
	const { userHasConsented, allowCookies, declineCookies } = useCookieConsent();
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted || userHasConsented) {
		return null;
	}

	return (
		<div
			role="region"
			aria-label={t("label")}
			className="inset-x-0 bottom-0 sm:left-4 sm:bottom-4 sm:max-w-sm sm:inset-x-auto fixed z-50"
		>
			<div className="p-5 border border-border bg-card text-card-foreground">
				<p className="text-meta">{t("message")}</p>
				<div className="mt-4 gap-2 flex">
					<Button variant="outline" className="flex-1" onClick={() => declineCookies()}>
						{t("decline")}
					</Button>
					<Button variant="secondary" className="flex-1" onClick={() => allowCookies()}>
						{t("allow")}
					</Button>
				</div>
			</div>
		</div>
	);
}
