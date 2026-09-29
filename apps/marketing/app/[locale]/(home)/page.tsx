import { FamilyLinkFigure } from "@home/components/FamilyLinkFigure";
import { LetterParagraph, LetterSection } from "@home/components/LetterSection";
import { PricingLedger } from "@home/components/PricingLedger";
import { SamplePage } from "@home/components/SamplePage";
import { SignOff } from "@home/components/SignOff";
import { WhatWeMade } from "@home/components/WhatWeMade";
import { LocaleLink } from "@i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";

/**
 * The homepage is the founders' letter (design.md §15): a 680px column on the desk, one biodata
 * page read top to bottom inside it, and the pricing in its last paragraph. No hero block, no
 * feature grid, no testimonials: masthead, dateline, "Dear family,".
 */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("home");

	return (
		<article aria-labelledby="letter-title" className="letter-column pt-12 md:pt-20">
			{/* A letter opens on its dateline and salutation, not a hero: the call to begin lives
			    in the masthead and the P.S. (design.md §15). The title is for screen readers and
			    search only. */}
			<header>
				<p className="label-caps text-muted-foreground">{t("dateline")}</p>
				<h1 id="letter-title" className="sr-only">
					{t("title")}
				</h1>
			</header>

			<div aria-hidden="true" className="mt-6 double-rule" />

			<p className="mt-10 leading-9 font-display text-[1.75rem] text-foreground italic">
				{t("salutation")}
			</p>

			<LetterSection id="why" heading={t("why.heading")} className="mt-8">
				<LetterParagraph>{t("why.p1")}</LetterParagraph>
				<LetterParagraph>{t("why.p2")}</LetterParagraph>
				<LetterParagraph>{t("why.p3")}</LetterParagraph>
			</LetterSection>

			<WhatWeMade />

			<LetterSection id="sample" heading={t("sample.heading")}>
				<LetterParagraph>{t("sample.intro")}</LetterParagraph>
				<SamplePage />
			</LetterSection>

			<LetterSection id="parents" heading={t("parents.heading")}>
				<LetterParagraph>{t("parents.p1")}</LetterParagraph>
				<LetterParagraph>{t("parents.p2")}</LetterParagraph>
				<FamilyLinkFigure caption={t("parents.figureCaption")} />
			</LetterSection>

			<LetterSection id="safety" heading={t("safety.heading")}>
				<LetterParagraph>{t("safety.p1")}</LetterParagraph>
				<div className="pl-5 border-l-2 border-foreground">
					<p className="text-body text-foreground">{t("safety.disclosure")}</p>
					<p className="mt-1 text-body text-foreground">{t("safety.sameForEveryone")}</p>
				</div>
				<p>
					<LocaleLink
						href="/safety"
						className="text-ui ui-semi text-seal-ink underline underline-offset-4"
					>
						{t("safety.more")}
					</LocaleLink>
				</p>
			</LetterSection>

			<PricingLedger />

			<SignOff />
		</article>
	);
}
