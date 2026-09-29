import React from "react";
import { createTranslator } from "use-intl/core";

import LinkFallback from "../components/LinkFallback";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper, { MailHeading, MailText } from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function EmailVerification({
	url,
	locale,
	translations,
}: {
	url: string;
	name: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: {
			...translations.emailVerification,
			common: translations.common,
		},
	});

	return (
		<Wrapper lang={locale} preview={t("body")} footer={t("common.footer")}>
			<MailHeading>{t("headline")}</MailHeading>
			<MailText>{t("body")}</MailText>

			<PrimaryButton href={url}>{t("confirmEmail")}</PrimaryButton>

			<MailText muted>{t("common.notYou")}</MailText>
			<LinkFallback label={t("common.openLinkInBrowser")} href={url} />
		</Wrapper>
	);
}

EmailVerification.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	url: "#",
	name: "Priya",
};

export default EmailVerification;
