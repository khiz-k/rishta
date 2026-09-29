import { config } from "@config";
import { getTranslations } from "next-intl/server";

/** A quiet foot line: the name, the safety notice and the legal links. */
export async function Footer() {
	const t = await getTranslations("footer");
	const base = config.marketingUrl ?? "";
	return (
		<footer className="px-5 mt-10 max-w-5xl mx-auto w-full text-center text-meta text-muted-foreground">
			<p>{t("safety")}</p>
			<p className="mt-2 gap-4 flex flex-wrap items-baseline justify-center">
				<span className="font-display">Rishta</span>
				<a href={`${base}/safety`} className="hover:text-foreground">
					{t("safetyLink")}
				</a>
				<a href={`${base}/legal/privacy-policy`} className="hover:text-foreground">
					{t("privacy")}
				</a>
				<a href={`${base}/legal/terms`} className="hover:text-foreground">
					{t("terms")}
				</a>
			</p>
		</footer>
	);
}
