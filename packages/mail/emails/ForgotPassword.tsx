import React from "react";
import { createTranslator } from "use-intl/core";

import LinkFallback from "../components/LinkFallback";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper, { MailHeading, MailText } from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function ForgotPassword({
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
			...translations.forgotPassword,
			common: translations.common,
		},
	});

	return (
		<Wrapper lang={locale} preview={t("body")} footer={t("common.footer")}>
			<MailHeading>{t("headline")}</MailHeading>
			<MailText>{t("body")}</MailText>

			<PrimaryButton href={url}>{t("resetPassword")}</PrimaryButton>

			<MailText muted>{t("common.notYou")}</MailText>
			<LinkFallback label={t("common.openLinkInBrowser")} href={url} />
		</Wrapper>
	);
}

ForgotPassword.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	url: "#",
	name: "Priya",
};

export default ForgotPassword;
