import { BiodataDocument } from "@biodata/components/BiodataDocument";
import { createPageText } from "@biodata/lib/page-text";
import type { FamilyReaction } from "@household/components/PencilNotes";
import type { PageLanguage } from "@repo/database/drizzle/domain";
import type { SaasMessages } from "@repo/i18n";
import { type FamilyLanguage, familyLanguageDir } from "@repo/i18n/lib/family-languages";
import type { PageView } from "@shared/lib/api-types";
import { formatFullDay, formatShortDate } from "@shared/lib/format";
import { createTranslator } from "next-intl";
import Link from "next/link";

import { FamilyReactions } from "./FamilyReactions";
import { LanguageRow } from "./LanguageRow";

/** A faint diagonal watermark naming who it was shared with, by whom, and when. */
function Watermark({ text }: { text: string }) {
	return (
		<div
			aria-hidden="true"
			className="inset-0 pointer-events-none absolute overflow-hidden select-none"
		>
			<div className="gap-x-16 gap-y-24 absolute inset-[-50%] flex -rotate-[24deg] flex-wrap content-start">
				{Array.from({ length: 36 }, (_, index) => (
					<span
						key={index}
						className="font-display text-section whitespace-nowrap text-foreground/[0.06]"
					>
						{text}
					</span>
				))}
			</div>
		</div>
	);
}

export interface FamilyLinkData {
	token: string;
	language: FamilyLanguage;
	page: PageView;
	original: PageView | null;
	translated: boolean;
	watermark: { recipientLabel: string; sharedBy: string; until: string };
	note: { text: string; translated: boolean; signer: string } | null;
	myReaction: { reaction: FamilyReaction | null; text: string | null } | null;
}

/**
 * The family link (design.md §5.9): Ammi reads the page in her language on WhatsApp and says
 * what she thinks in one tap, without installing or learning anything. The photo is always
 * veiled; the sealed section only says it opens when they both say yes.
 *
 * A Server Component. The whole page is set here, in the chosen language, from the `page` and
 * `family` bundles; the only client islands are `LanguageRow` and `FamilyReactions`, to keep
 * the link light in WhatsApp's in-app browser on a mid-range phone. "Show the original" is a
 * plain link (`?original=1`), not client state.
 */
export function FamilyLinkPage({
	data,
	messages,
	showOriginal,
	englishReactions,
}: {
	data: FamilyLinkData;
	/** English overlaid with the family bundle for `data.language` (missing strings stay English). */
	messages: SaasMessages;
	showOriginal: boolean;
	englishReactions: Record<FamilyReaction, string> | null;
}) {
	const locale = data.language;
	const t = createTranslator({ locale, messages, namespace: "family.link" });
	const text = createPageText(createTranslator({ locale, messages, namespace: "page" }), locale);
	const { watermark } = data;

	const translatedView: PageView = {
		...data.page,
		language: data.translated ? data.language : data.page.language,
		dir: data.translated ? familyLanguageDir(data.language) : data.page.dir,
	};
	const original = showOriginal && data.original !== null;
	const view = original && data.original ? data.original : translatedView;
	const originalLanguage: PageLanguage = (data.original ?? data.page).language;
	const wantsTranslation = data.language !== originalLanguage;

	return (
		<div className="min-h-dvh bg-background">
			<div className="px-4 md:px-8 py-4 border-b border-border bg-muted">
				<div className="mx-auto max-w-(--page-width)">
					<p className="text-ui">
						{t("strip", { label: watermark.recipientLabel, name: watermark.sharedBy })}
					</p>
					<p className="text-ui text-muted-foreground">
						{t("until", { date: formatFullDay(watermark.until, locale) })}
					</p>
					<LanguageRow current={data.language} label={t("languageLabel")} />
				</div>
			</div>

			<div className="md:px-8 pt-4 md:pt-10 pb-16">
				{wantsTranslation && (
					<p className="px-4 md:px-0 mb-3 mx-auto max-w-(--page-width) text-body text-muted-foreground">
						{data.translated ? (
							<>
								{t("translated")}{" "}
								<Link
									href={{
										query: original
											? { lang: data.language }
											: { lang: data.language, original: "1" },
									}}
									replace
									scroll={false}
									prefetch={false}
									className="min-h-11 inline-flex items-center text-seal-ink underline-offset-4 hover:underline"
								>
									{original ? t("showTranslation") : t("showOriginal")}
								</Link>
							</>
						) : (
							t("noTranslation")
						)}
					</p>
				)}

				{data.note && (
					<figure className="mx-3 md:mx-auto -mb-3 px-5 md:px-7 pt-5 pb-4 relative z-10 max-w-[calc(var(--page-width)-2rem)] border border-border bg-popover">
						<figcaption className="label-caps text-muted-foreground">
							{t("noteFrom", { name: data.note.signer })}
						</figcaption>
						<blockquote className="mt-2 font-display text-family-value whitespace-pre-line">
							{data.note.text}
						</blockquote>
					</figure>
				)}

				<BiodataDocument
					page={view}
					text={text}
					scale="family"
					className="max-md:border-x-0"
					watermark={
						<Watermark
							text={t("watermark", {
								label: watermark.recipientLabel,
								name: watermark.sharedBy,
								date: formatShortDate(new Date(), locale),
							})}
						/>
					}
				/>

				<div className="px-4 md:px-0 mx-auto max-w-(--page-width)">
					<FamilyReactions
						token={data.token}
						sharedBy={watermark.sharedBy}
						initialReaction={data.myReaction?.reaction ?? null}
						initialText={data.myReaction?.text ?? null}
						englishReactions={englishReactions}
					/>
				</div>
			</div>
		</div>
	);
}
