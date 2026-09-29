import { FamilyLinkPage } from "@family/components/FamilyLinkPage";
import type { FamilyReaction } from "@household/components/PencilNotes";
import {
	type FamilyLanguage,
	familyLanguageDir,
	getFamilyMessages,
	getMessagesForLocale,
	isFamilyLanguage,
	type SaasMessages,
} from "@repo/i18n";
import { PaperSlip } from "@shared/components/PaperSlip";
import { serverFamilyLink } from "@shared/lib/api-server";
import { toMerged } from "es-toolkit";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Rishta",
	robots: { index: false, follow: false, nocache: true },
};

function firstParam(value: string | string[] | undefined) {
	return Array.isArray(value) ? value[0] : value;
}

/**
 * The family link: server-rendered, the page at 130% in the chosen language, with three square
 * buttons. Labels come from the family bundle; values from the cached translation, always
 * labelled as translated. `?lang=` re-sets the page in another family language (the language
 * row) and `?original=1` shows the words as written.
 */
export default async function FamilyLinkRoute({
	params,
	searchParams,
}: {
	params: Promise<{ token: string }>;
	searchParams: Promise<{ lang?: string | string[]; original?: string | string[] }>;
}) {
	const [{ token }, query] = await Promise.all([params, searchParams]);
	const requested = firstParam(query.lang);
	const t = await getTranslations("family.link");
	const { data, code } = await serverFamilyLink(
		token,
		isFamilyLanguage(requested) ? requested : undefined,
	);

	if (!data || data.state === "closed") {
		const sharedBy = data?.state === "closed" ? data.sharedBy : null;
		return (
			<main className="px-4 pt-16 mx-auto max-w-(--page-width)">
				<PaperSlip
					role="status"
					title={
						!data || code
							? t("error")
							: sharedBy
								? t("closed", { name: sharedBy })
								: t("closedNoName")
					}
				/>
			</main>
		);
	}

	const language: FamilyLanguage = isFamilyLanguage(data.language) ? data.language : "en";
	const english = await getMessagesForLocale<SaasMessages>("en", "saas");
	const overlay = await getFamilyMessages(language);
	const messages: SaasMessages = overlay ? toMerged(english, overlay) : english;
	const englishReactions: Record<FamilyReaction, string> | null =
		language === "en"
			? null
			: {
					proceed: english.family.link.reactions.proceed,
					lets_talk: english.family.link.reactions.lets_talk,
					not_for_us: english.family.link.reactions.not_for_us,
				};

	return (
		// The page itself is set on the server; the client islands (the reactions and the
		// language row) only need the `family` words.
		<NextIntlClientProvider locale={language} messages={{ family: messages.family }}>
			<main lang={language} dir={familyLanguageDir(language)}>
				<FamilyLinkPage
					messages={messages}
					showOriginal={firstParam(query.original) === "1"}
					englishReactions={englishReactions}
					data={{
						token,
						language,
						page: data.page,
						original: data.original,
						translated: data.translated,
						watermark: data.watermark,
						note: data.note,
						myReaction: data.myReaction,
					}}
				/>
			</main>
		</NextIntlClientProvider>
	);
}
