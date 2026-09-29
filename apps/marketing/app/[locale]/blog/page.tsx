import { PostListItem } from "@blog/components/PostListItem";
import { getAllPosts } from "@blog/lib/posts";
import { LetterHead } from "@shared/components/LetterHead";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
	const { locale } = await props.params;
	const t = await getTranslations({ locale, namespace: "blog" });
	return {
		title: t("title"),
		description: t("description"),
	};
}

/** Notes (design.md §15): occasional letters, listed like the entries in a letter book. */
export default async function BlogListPage(props: { params: Promise<{ locale: string }> }) {
	const { locale } = await props.params;
	setRequestLocale(locale);

	const t = await getTranslations({ locale, namespace: "blog" });
	const posts = await getAllPosts(locale);

	return (
		<div className="letter-column pt-12 md:pt-20">
			<LetterHead title={t("title")} lead={t("description")} />

			{posts.length > 0 ? (
				<ol className="border-t border-border">
					{posts.map((post) => (
						<PostListItem post={post} key={post.path} />
					))}
				</ol>
			) : (
				<p className="pencil text-letter">{t("empty")}</p>
			)}
		</div>
	);
}
