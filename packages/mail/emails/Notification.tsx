import React from "react";
import { createTranslator } from "use-intl/core";

import LinkFallback from "../components/LinkFallback";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper, { MailHeading, MailText } from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

/**
 * A discreet notification: the headline is the subject line ("A letter is waiting for you"),
 * the message never names anyone unless the reader turned discreet email off, and the button
 * opens the app.
 */
export function Notification({
	title,
	message,
	link,
	locale,
	translations,
}: {
	title: string;
	message?: string;
	link?: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: {
			...translations.notification,
			common: translations.common,
		},
	});

	return (
		<Wrapper lang={locale} preview={message ?? title} footer={t("common.footer")}>
			<MailHeading>{title}</MailHeading>
			{message ? <MailText>{message}</MailText> : null}
			{link ? (
				<>
					<MailText>{t("openInApp")}</MailText>
					<PrimaryButton href={link}>{t("view")}</PrimaryButton>
					<LinkFallback label={t("common.openLinkInBrowser")} href={link} />
				</>
			) : null}
		</Wrapper>
	);
}

Notification.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	title: "A letter is waiting for you",
	message: "A new letter is waiting.",
	link: "https://rishta.local/letters",
};

export default Notification;
