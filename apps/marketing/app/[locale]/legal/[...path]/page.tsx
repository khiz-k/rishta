import { PostContent } from "@blog/components/PostContent";
import { localeRedirect } from "@i18n/routing";
import { getAllLegalPagePaths, getLegalPageByPath } from "@legal/lib/pages";
import { LetterHead } from "@shared/components/LetterHead";
import { getActivePathFromUrlParam } from "@shared/lib/content";
import { getTranslations, setRequestLocale } from "next-intl/server";

export function generateStaticParams() {
	const paths = getAllLegalPagePaths();
	return paths.map((path) => ({ path: [path] }));
}

interface Params {
	path: string;
	locale: string;
}

export async function generateMetadata(props: { params: Promise<Params> }) {
	const { path, locale } = await props.params;
	const activePath = getActivePathFromUrlParam(path);
	const page = await getLegalPageByPath(activePath, { locale });

	return {
		title: page?.title,
		openGraph: {
			title: page?.title,
		},
	};
}

export default async function LegalPage(props: { params: Promise<Params> }) {
	const { path, locale } = await props.params;
	setRequestLocale(locale);

	const t = await getTranslations({ locale, namespace: "legal" });
	const activePath = getActivePathFromUrlParam(path);
	const page = await getLegalPageByPath(activePath, { locale });

	if (!page) {
		localeRedirect({ href: "/", locale });
		return;
	}

	const { title, body } = page;

	return (
		<div className="letter-column pt-12 md:pt-20">
			<LetterHead dateline={t("dateline")} title={title} />
			<PostContent content={body} />
		</div>
	);
}
