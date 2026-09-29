import { LocaleLink } from "@i18n/routing";
import { Logo } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { appUrl } from "@shared/lib/app-url";
import { getTranslations } from "next-intl/server";

/**
 * The marketing masthead (design.md §15): the Rishta lockup on the left; "Sign in" and
 * [Begin a page] on the right. No menu, no hamburger, no colour-mode toggle: it is a letter.
 */
export async function Masthead() {
	const t = await getTranslations("common.menu");

	return (
		<header className="border-b border-border bg-background" data-test="navigation">
			<div className="px-5 md:px-8 h-16 max-w-6xl mx-auto flex w-full items-center justify-between">
				<LocaleLink
					href="/"
					className="-mx-1 px-1 py-2 flex items-center"
					aria-label={t("home")}
				>
					<Logo variant="lockup" />
				</LocaleLink>

				<nav aria-label={t("label")} className="gap-2 sm:gap-4 flex items-center">
					<a
						href={appUrl("/login")}
						className="px-2 py-3 text-ui ui-semi text-foreground underline-offset-4 hover:underline"
					>
						{t("login")}
					</a>
					<Button asChild variant="primary" className="max-[360px]:px-3">
						<a href={appUrl("/signup")}>{t("begin")}</a>
					</Button>
				</nav>
			</div>
		</header>
	);
}
