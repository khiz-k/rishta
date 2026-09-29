import { PostContent } from "@blog/components/PostContent";
import { getPostBySlug, getPublishedPostPaths } from "@blog/lib/posts";
import { LocaleLink, localeRedirect } from "@i18n/routing";
import { LogoMark } from "@repo/ui";
import { getBaseUrl } from "@shared/lib/base-url";
import { getActivePathFromUrlParam } from "@shared/lib/content";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

export function generateStaticParams() {
	const paths = getPublishedPostPaths();
	return paths.map((path) => ({ path: [path] }));
}

interface Params {
	path: string;
	locale: string;
}

export async function generateMetadata(props: { params: Promise<Params> }) {
	const { path, locale } = await props.params;
	const slug = getActivePathFromUrlParam(path);
	const post = await getPostBySlug(slug, { locale });

	return {
		title: post?.title,
		description: post?.excerpt,
		openGraph: {
			type: "article",
			title: post?.title,
			description: post?.excerpt,
			images: post?.image
				? [
						post.image.startsWith("http")
							? post.image
							: new URL(post.image, getBaseUrl()).toString(),
					]
				: undefined,
		},
	};
}

/** A Note reads as a letter: the dateline, the title in Tiro, the body in Tiro, a seal at the end. */
export default async function BlogPostPage(props: { params: Promise<Params> }) {
	const { path, locale } = await props.params;
	setRequestLocale(locale);

	const t = await getTranslations({ locale, namespace: "blog" });
	const format = await getFormatter({ locale });

	const slug = getActivePathFromUrlParam(path);
	const post = await getPostBySlug(slug, { locale });

	if (!post) {
		return localeRedirect({ href: "/blog", locale });
	}

	const { title, date, authorName, excerpt, body } = post;

	return (
		<article className="letter-column pt-10 md:pt-16">
			<p>
				<LocaleLink
					href="/blog"
					className="py-2 inline-block nav-caps text-foreground hover:underline"
				>
					← {t("back")}
				</LocaleLink>
			</p>

			<header className="mt-8 pb-10">
				<p className="label-caps text-muted-foreground tabular">
					<time dateTime={date}>
						{format.dateTime(new Date(date), { dateStyle: "long" })}
					</time>
					{authorName && <span> · {t("from", { name: authorName })}</span>}
				</p>
				<h1 className="mt-3 md:text-[2.5rem] md:leading-[3rem] font-display text-title text-balance text-foreground">
					{title}
				</h1>
				{excerpt && (
					<p className="mt-4 font-display text-letter text-muted-foreground italic">
						{excerpt}
					</p>
				)}
				<div aria-hidden="true" className="mt-10 double-rule" />
			</header>

			<PostContent content={body} letter />

			<footer className="mt-12 gap-4 flex items-center">
				<LogoMark className="size-12" />
				{authorName && (
					<p className="font-display text-section text-foreground">{authorName}</p>
				)}
			</footer>
		</article>
	);
}
