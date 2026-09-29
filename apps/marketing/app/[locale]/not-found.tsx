import { LocaleLink } from "@i18n/routing";
import { MonogramSeal } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { getTranslations } from "next-intl/server";

export default async function NotFoundPage() {
	const t = await getTranslations("notFound");

	return (
		<div className="letter-column py-20 md:py-28">
			<MonogramSeal initials="?" state="pending" size={64} />
			<p className="mt-8 label-caps text-muted-foreground tabular">{t("code")}</p>
			<h1 className="mt-2 font-display text-title text-foreground">{t("title")}</h1>
			<p className="mt-3 font-display text-letter text-muted-foreground">{t("message")}</p>
			<Button asChild variant="secondary" className="mt-8">
				<LocaleLink href="/">{t("goToHomepage")}</LocaleLink>
			</Button>
		</div>
	);
}
