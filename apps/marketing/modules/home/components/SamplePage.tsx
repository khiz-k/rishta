"use client";

import { cn, InvocationGlyph, MonogramSeal, VerifiedMark } from "@repo/ui";
import { CheckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type PropsWithChildren, useState } from "react";

import {
	SAMPLE_LANGUAGES,
	SAMPLE_PAGES,
	SAMPLE_SECTIONS,
	type SampleLanguage,
} from "../lib/sample-page";

/**
 * A pencil note in the page's margin, in the site's language. On wide screens it sits outside the
 * page, level with what it describes (absolute, with its static vertical position); on phones it
 * is written inline, between the lines.
 */
function MarginNote({
	children,
	className,
	wideOnly,
}: PropsWithChildren<{ className?: string; wideOnly?: boolean }>) {
	const locale = useLocale();
	return (
		<p
			lang={locale}
			dir="ltr"
			className={cn(
				"my-3 pl-3 border-l border-rule pencil text-meta",
				"xl:absolute xl:left-full xl:my-0 xl:ml-10 xl:block xl:w-56 xl:border-l-0 xl:pl-0",
				wideOnly && "hidden",
				className,
			)}
		>
			{children}
		</p>
	);
}

/**
 * The sample page on the founders' letter (design.md §15): one biodata, read top to bottom, with
 * pencil marginalia. The language row re-sets the page in another script from static,
 * hand-written content; nothing is translated at runtime.
 */
export function SamplePage() {
	const t = useTranslations("home.sample");
	const [language, setLanguage] = useState<SampleLanguage>("en");
	// The page turns (180ms) only when the reader re-sets it, never on first paint.
	const [turned, setTurned] = useState(false);
	const page = SAMPLE_PAGES[language];

	return (
		<div className="mt-8">
			<div className="gap-x-5 gap-y-2 flex flex-wrap items-baseline">
				<p id="sample-language-label" className="label-caps text-muted-foreground">
					{t("languageLabel")}
				</p>
				<div
					role="group"
					aria-labelledby="sample-language-label"
					className="gap-x-1 flex flex-wrap"
				>
					{SAMPLE_LANGUAGES.map((code) => {
						const active = code === language;
						return (
							<button
								key={code}
								type="button"
								lang={code}
								aria-pressed={active}
								onClick={() => {
									setLanguage(code);
									setTurned(true);
								}}
								className={cn(
									"min-h-11 px-2 -mb-px cursor-pointer border-b-2 text-body transition-colors",
									active
										? "border-foreground text-foreground"
										: "border-transparent text-muted-foreground hover:text-foreground",
								)}
							>
								{SAMPLE_PAGES[code].endonym}
							</button>
						);
					})}
				</div>
			</div>

			{/* Why this page: plain reasons, gaps included. Never a score. */}
			<div className="mt-6 relative max-w-(--page-width)">
				<div className="px-5 py-4 border border-border bg-card">
					<p className="label-caps text-muted-foreground">{t("whyLabel")}</p>
					<ul className="mt-2 space-y-1.5 text-body">
						<li className="gap-2 flex items-start">
							<CheckIcon aria-hidden="true" className="mt-1 size-4 shrink-0" />
							{t("reasons.timeline")}
						</li>
						<li className="gap-2 flex items-start">
							<CheckIcon aria-hidden="true" className="mt-1 size-4 shrink-0" />
							{t("reasons.diet")}
						</li>
						<li className="gap-2 flex items-start text-muted-foreground">
							<span aria-hidden="true" className="w-4 shrink-0 text-center">
								–
							</span>
							{t("reasons.community")}
						</li>
					</ul>
				</div>
				<MarginNote className="xl:top-4">{t("margin.reasons")}</MarginNote>
			</div>

			<article
				key={language}
				lang={language}
				dir={page.dir}
				aria-label={t("pageLabel")}
				className={cn(
					"mt-5 relative max-w-(--page-width) border border-border bg-card text-card-foreground",
					turned && "animate-paper-fade",
				)}
			>
				<div aria-hidden="true" className="double-rule" />
				<div className="pt-4 pb-8 page-pad">
					<p className="mt-5 relative flex justify-center text-center">
						<InvocationGlyph kind="om" />
					</p>
					<MarginNote wideOnly className="xl:-mt-8">
						{t("margin.invocation")}
					</MarginNote>

					<header className="mt-6 gap-4 md:gap-6 grid grid-cols-[1fr_30%]">
						<div className="min-w-0">
							<h3 className="font-display text-name-sm tracking-[-0.005em] break-words text-foreground min-[400px]:text-title">
								{page.name}
							</h3>
							<p className="mt-1 text-body text-foreground tabular">{page.meta}</p>
							<p className="mt-1 text-meta text-muted-foreground">{page.signer}</p>
							<div className="mt-1.5">
								<VerifiedMark className="text-muted-foreground">
									{page.verified}
								</VerifiedMark>
							</div>
						</div>
						{/* The veil is all a stranger ever receives: no clear photo exists here at all. */}
						<div
							role="img"
							aria-label={page.veiledAlt}
							className="relative aspect-[4/5] w-full overflow-hidden border border-border bg-veil"
						>
							<div aria-hidden="true" className="inset-0 absolute blur-[16px]">
								<div className="absolute top-[22%] left-1/2 h-[34%] w-[42%] -translate-x-1/2 rounded-full bg-muted-foreground/35" />
								<div className="absolute top-[58%] left-1/2 h-[60%] w-[88%] -translate-x-1/2 rounded-full bg-muted-foreground/30" />
							</div>
							<span className="inset-x-0 bottom-2 absolute flex justify-center">
								<span className="px-1.5 border border-border bg-card label-caps text-foreground">
									{page.veiled}
								</span>
							</span>
						</div>
					</header>
					<MarginNote className="xl:-mt-20">{t("margin.signer")}</MarginNote>

					{SAMPLE_SECTIONS.map((section) => (
						<section key={section.id} className="mt-8">
							<h4 className="hairline-after font-display text-section text-foreground">
								{page.sections[section.id]}
							</h4>
							{section.id === "family" && (
								<MarginNote wideOnly className="xl:mt-0">
									{t("margin.family")}
								</MarginNote>
							)}
							<dl className="mt-3">
								{section.fields.map((field) => (
									<div
										key={field}
										className="py-1.5 gap-x-4 grid grid-cols-[minmax(6.75rem,34%)_1fr]"
									>
										<dt className="pt-[0.3rem] label-caps text-muted-foreground">
											{page.labels[field]}
										</dt>
										<dd className="min-w-0 text-body break-words text-foreground">
											{page.values[field]}
										</dd>
									</div>
								))}
							</dl>
						</section>
					))}

					<section className="mt-8">
						<h4 className="hairline-after font-display text-section text-foreground">
							{page.sections.about}
						</h4>
						<p className="mt-3 text-body text-foreground">{page.about}</p>
					</section>

					<section aria-label={page.sealedAria} className="mt-8">
						<h4 className="hairline-after font-display text-section text-foreground">
							{page.sections.sealed}
						</h4>
						<MarginNote className="xl:mt-3">{t("margin.sealed")}</MarginNote>
						<div className="mt-3 p-4 md:p-5 gap-4 flex items-center border border-dashed border-border bg-sealed">
							<MonogramSeal initials={page.name} state="pending" size={40} />
							<p className="text-body text-muted-foreground">{page.sealedNote}</p>
						</div>
					</section>
				</div>
			</article>

			<p className="sr-only" aria-live="polite">
				{t("setIn", { language: page.endonym })}
			</p>

			<p className="mt-4 max-w-(--page-width) text-meta text-muted-foreground">
				{t("footnote")}
			</p>
		</div>
	);
}
