import type { Post } from "@blog/types";
import { LocaleLink } from "@i18n/routing";
import { getFormatter, getTranslations } from "next-intl/server";

/** One Note in the list: its date, its title in Tiro and the first lines. No image, no card. */
export async function PostListItem({ post }: { post: Post }) {
	const format = await getFormatter();
	const t = await getTranslations("blog");
	const { title, excerpt, date, path, authorName } = post;

	return (
		<li className="py-8 border-b border-border">
			<p className="label-caps text-muted-foreground tabular">
				<time dateTime={date}>
					{format.dateTime(new Date(date), { dateStyle: "long" })}
				</time>
				{authorName && <span> · {t("from", { name: authorName })}</span>}
			</p>
			<h2 className="mt-2 font-display text-title-sm text-foreground">
				<LocaleLink href={`/blog/${path}`} className="underline-offset-4 hover:underline">
					{title}
				</LocaleLink>
			</h2>
			{excerpt && (
				<p className="mt-2 font-display text-letter text-muted-foreground">{excerpt}</p>
			)}
			<p className="mt-3">
				<LocaleLink
					href={`/blog/${path}`}
					className="text-ui ui-semi text-seal-ink underline underline-offset-4"
					aria-label={t("readTitle", { title })}
				>
					{t("read")}
				</LocaleLink>
			</p>
		</li>
	);
}
