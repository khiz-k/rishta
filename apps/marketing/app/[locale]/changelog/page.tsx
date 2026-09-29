import { ChangelogSection } from "@changelog/components/ChangelogSection";
import { LetterHead } from "@shared/components/LetterHead";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
	const { locale } = await props.params;
	const t = await getTranslations({ locale, namespace: "changelog" });
	return {
		title: t("title"),
		// Hidden (design.md §15): reachable, but not linked and not indexed.
		robots: { index: false, follow: false },
	};
}

export default async function ChangelogPage(props: { params: Promise<{ locale: string }> }) {
	const { locale } = await props.params;
	setRequestLocale(locale);

	const t = await getTranslations({ locale, namespace: "changelog" });

	return (
		<div className="letter-column pt-12 md:pt-20">
			<LetterHead title={t("title")} lead={t("description")} />
			<ChangelogSection />
		</div>
	);
}
