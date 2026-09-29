import { LogoMark } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { appUrl } from "@shared/lib/app-url";
import { getTranslations } from "next-intl/server";

/** "With respect," a pressed seal, and the P.S. that gives the product its name. */
export async function SignOff() {
	const t = await getTranslations("home.signoff");
	const tHome = await getTranslations("home");

	return (
		<section aria-label={t("label")} className="mt-16">
			<p className="font-display text-letter text-foreground italic">{t("closing")}</p>
			<div className="mt-4 gap-4 flex items-center">
				<LogoMark className="size-14" />
				<p className="font-display text-section text-foreground">{t("signature")}</p>
			</div>

			<div className="mt-12 pt-6 border-t border-border">
				<p className="font-display text-letter text-foreground">
					{t("ps")} <span className="text-muted-foreground italic">({t("gloss")})</span>
				</p>
				<p className="mt-1 font-display text-letter text-foreground">{t("psLine")}</p>
				<div className="mt-6 gap-x-6 gap-y-3 flex flex-wrap items-center">
					<Button asChild variant="primary" size="lg">
						<a href={appUrl("/signup")}>{tHome("begin")}</a>
					</Button>
					<a
						href={appUrl("/login")}
						className="py-2 text-ui ui-semi text-foreground underline underline-offset-4"
					>
						{tHome("signIn")}
					</a>
				</div>
				<p className="mt-3 max-w-sm text-meta text-muted-foreground">{tHome("leadNote")}</p>
			</div>
		</section>
	);
}
