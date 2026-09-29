import { Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";

import LinkFallback from "../components/LinkFallback";
import { fonts, paper } from "../components/paper";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper, { MailHeading, MailText } from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function NewUser({
	url,
	otp,
	locale,
	translations,
}: {
	url: string;
	name: string;
	otp: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: { ...translations.newUser, common: translations.common },
	});

	return (
		<Wrapper lang={locale} preview={t("body")} footer={t("common.footer")}>
			<MailHeading>{t("headline")}</MailHeading>
			<MailText>{t("body")}</MailText>

			<Text
				className="my-5 px-4 py-3"
				style={{ backgroundColor: paper.sealed, border: `1px dashed ${paper.border}` }}
			>
				<span
					style={{
						fontSize: 12,
						letterSpacing: "0.08em",
						textTransform: "uppercase",
						color: paper.muted,
					}}
				>
					{t("common.otp")}
				</span>
				<br />
				<span
					style={{
						fontFamily: fonts.sans,
						fontSize: 28,
						fontWeight: 600,
						lineHeight: "40px",
						letterSpacing: "0.16em",
						fontVariantNumeric: "tabular-nums",
						color: paper.ink,
					}}
				>
					{otp}
				</span>
			</Text>

			<MailText>{t("common.useLink")}</MailText>
			<PrimaryButton href={url}>{t("confirmEmail")}</PrimaryButton>

			<LinkFallback label={t("common.openLinkInBrowser")} href={url} />
		</Wrapper>
	);
}

NewUser.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	url: "#",
	name: "Priya",
	otp: "123456",
};

export default NewUser;
