import { ContactForm } from "@home/components/ContactForm";
import { LocaleLink } from "@i18n/routing";
import { LetterHead } from "@shared/components/LetterHead";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
	const { locale } = await props.params;
	const t = await getTranslations({ locale, namespace: "contact" });
	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function ContactPage(props: { params: Promise<{ locale: string }> }) {
	const { locale } = await props.params;
	setRequestLocale(locale);

	const t = await getTranslations({ locale, namespace: "contact" });
	return (
		<div className="letter-column pt-12 md:pt-20">
			<LetterHead title={t("title")} lead={t("description")}>
				<p className="mt-4 text-body text-foreground">
					{t("safetyNote")}{" "}
					<LocaleLink
						href="/safety"
						className="text-seal-ink underline underline-offset-4"
					>
						{t("safetyLink")}
					</LocaleLink>
				</p>
			</LetterHead>

			<div className="max-w-xl">
				<ContactForm />
			</div>
		</div>
	);
}
