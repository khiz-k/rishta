import React from "react";
import { createTranslator } from "use-intl/core";

import LinkFallback from "../components/LinkFallback";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper, { MailHeading, MailText } from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

/**
 * A household invitation. Two kinds share one Better Auth invitation:
 * - `member`: a parent, sibling or helper joins the household (pencil notes, never the letters)
 * - `claim`: the candidate is asked to read and confirm a page a relative started for them
 */
export function OrganizationInvitation({
	url,
	organizationName,
	inviterName,
	kind = "member",
	locale,
	translations,
}: {
	url: string;
	organizationName: string;
	inviterName?: string;
	kind?: "member" | "claim";
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: {
			...translations.organizationInvitation,
			common: translations.common,
		},
	});

	const inviter = inviterName?.trim() || t("someoneInFamily");

	if (kind === "claim") {
		return (
			<Wrapper
				lang={locale}
				preview={t("claimBody", { inviterName: inviter })}
				footer={t("common.footer")}
			>
				<MailHeading>{t("claimHeadline", { inviterName: inviter })}</MailHeading>
				<MailText>{t("claimBody", { inviterName: inviter })}</MailText>

				<PrimaryButton href={url}>{t("claimJoin")}</PrimaryButton>

				<LinkFallback label={t("common.openLinkInBrowser")} href={url} />
			</Wrapper>
		);
	}

	return (
		<Wrapper
			lang={locale}
			preview={t("body", { organizationName, inviterName: inviter })}
			footer={t("common.footer")}
		>
			<MailHeading>{t("headline", { organizationName })}</MailHeading>
			<MailText>{t("body", { organizationName, inviterName: inviter })}</MailText>

			<PrimaryButton href={url}>{t("join")}</PrimaryButton>

			<LinkFallback label={t("common.openLinkInBrowser")} href={url} />
		</Wrapper>
	);
}

OrganizationInvitation.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	url: "#",
	organizationName: "Priya",
	inviterName: "Nasreen",
	kind: "member",
};

export default OrganizationInvitation;
