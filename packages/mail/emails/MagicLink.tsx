import React from "react";
import { createTranslator } from "use-intl/core";

import LinkFallback from "../components/LinkFallback";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper, { MailHeading, MailText } from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function MagicLink({
	url,
	locale,
	translations,
}: {
	url: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: { ...translations.magicLink, common: translations.common },
	});

	return (
		<Wrapper lang={locale} preview={t("body")} footer={t("common.footer")}>
			<MailHeading>{t("headline")}</MailHeading>
			<MailText>{t("body")}</MailText>

			<PrimaryButton href={url}>{t("login")}</PrimaryButton>

			<MailText muted>{t("common.notYou")}</MailText>
			<LinkFallback label={t("common.openLinkInBrowser")} href={url} />
		</Wrapper>
	);
}

MagicLink.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	url: "#",
};

export default MagicLink;
