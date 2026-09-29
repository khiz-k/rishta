import { LetterHead } from "@shared/components/LetterHead";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
	const { locale } = await props.params;
	const t = await getTranslations({ locale, namespace: "safety" });
	return {
		title: t("metaTitle"),
		description: t("lead"),
	};
}

/** Full message keys per passage, so every item is checked against the English bundle. */
const PASSAGES = [
	{
		id: "private",
		items: [
			"private.items.veils",
			"private.items.sealed",
			"private.items.reading",
			"private.items.blocks",
			"private.items.links",
		],
	},
	{
		id: "consent",
		items: ["consent.items.adult", "consent.items.claim", "consent.items.family"],
	},
	{
		id: "notes",
		items: [
			"notes.items.sentence",
			"notes.items.contact",
			"notes.items.flags",
			"notes.items.limits",
		],
	},
	{
		id: "tips",
		items: [
			"tips.items.money",
			"tips.items.platform",
			"tips.items.call",
			"tips.items.meet",
			"tips.items.family",
		],
	},
] as const;

/**
 * Safety (design.md §15, spec.md F12): what stays private, how consent works, how notes are
 * screened, how to report, what to watch for, and the disclosure several US states require.
 */
export default async function SafetyPage(props: { params: Promise<{ locale: string }> }) {
	const { locale } = await props.params;
	setRequestLocale(locale);

	const t = await getTranslations({ locale, namespace: "safety" });

	return (
		<div className="letter-column pt-12 md:pt-20">
			<LetterHead dateline={t("dateline")} title={t("title")} lead={t("lead")} />

			<div className="pl-5 py-1 border-l-2 border-foreground">
				<p className="font-display text-letter text-foreground">
					{t("disclosure.background")}
				</p>
				<p className="mt-2 text-body text-foreground">{t("disclosure.same")}</p>
				<p className="mt-2 text-body text-muted-foreground">{t("disclosure.verify")}</p>
			</div>

			{PASSAGES.map((passage) => (
				<section
					key={passage.id}
					aria-labelledby={`${passage.id}-heading`}
					className="mt-14"
				>
					<h2
						id={`${passage.id}-heading`}
						className="hairline-after font-display text-section text-foreground"
					>
						{t(`${passage.id}.heading`)}
					</h2>
					<ul className="mt-4 space-y-4">
						{passage.items.map((item) => (
							<li key={item} className="gap-3 grid grid-cols-[0.75rem_1fr]">
								<span
									aria-hidden="true"
									className="w-3 mt-[0.7rem] h-px bg-foreground"
								/>
								<p className="text-body text-foreground">{t(item)}</p>
							</li>
						))}
					</ul>
				</section>
			))}

			<section aria-labelledby="reporting-heading" className="mt-14">
				<h2
					id="reporting-heading"
					className="hairline-after font-display text-section text-foreground"
				>
					{t("reporting.heading")}
				</h2>
				<p className="mt-4 font-display text-letter text-foreground">
					{t("reporting.promise")}
				</p>
				<p className="mt-3 text-body text-foreground">{t("reporting.how")}</p>
				<p className="mt-3 text-body text-foreground">{t("reporting.after")}</p>
			</section>

			<p className="mt-14 p-5 border border-destructive bg-card text-body text-foreground">
				{t("emergency")}
			</p>
		</div>
	);
}
