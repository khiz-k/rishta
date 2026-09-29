import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations("letters");
	return { title: t("title") };
}

/** On desktop, the space beside the list, before a letter is opened. */
export default async function LettersIndexPage() {
	const t = await getTranslations("letters");
	return (
		<div className="px-10 pt-24 lg:flex hidden justify-center">
			<p className="max-w-sm text-center font-display text-letter text-muted-foreground">
				{t("choose")}
			</p>
		</div>
	);
}
