import { config } from "@config";
import { LocaleLink } from "@i18n/routing";
import { Logo } from "@repo/ui";
import { getTranslations } from "next-intl/server";

/**
 * A quiet foot of the letter: the lockup, the disclosure several US states require, and the
 * four links design.md §15 names (Safety · Privacy · Terms · Contact), plus the Notes. No
 * de/es/fr switcher (design.md §17): the sample page's own row carries the languages families
 * read.
 */
export async function Footer() {
	const t = await getTranslations("common.footer");

	const links = [
		{ href: "/safety", label: t("safety") },
		{ href: "/legal/privacy-policy", label: t("privacyPolicy") },
		{ href: "/legal/terms", label: t("termsAndConditions") },
		{ href: "/contact", label: t("contact") },
		{ href: "/blog", label: t("notes") },
	];

	return (
		<footer className="mt-24 border-t border-border">
			<div className="px-5 md:px-8 py-10 gap-8 md:grid-cols-[1fr_auto] max-w-6xl mx-auto grid w-full">
				<div className="max-w-md">
					<Logo variant="lockup" />
					<p className="mt-4 text-meta text-muted-foreground">{t("disclosure")}</p>
					<p className="mt-2 text-meta text-muted-foreground">{t("sameForEveryone")}</p>
				</div>

				<div className="gap-6 md:items-end flex flex-col">
					<nav aria-label={t("label")}>
						<ul className="gap-x-6 gap-y-2 md:justify-end flex flex-wrap">
							{links.map((link) => (
								<li key={link.href}>
									<LocaleLink
										href={link.href}
										className="py-1 inline-block nav-caps text-foreground hover:underline"
									>
										{link.label}
									</LocaleLink>
								</li>
							))}
						</ul>
					</nav>
					<p className="text-ref text-muted-foreground tabular">
						© {new Date().getFullYear()} {config.appName}
					</p>
				</div>
			</div>
		</footer>
	);
}
