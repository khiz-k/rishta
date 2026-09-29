"use client";

import { useHousehold } from "@household/components/HouseholdProvider";
import { Button } from "@repo/ui";
import { isSameLocalDay, formatTime } from "@shared/lib/format";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import type { ReaderItem } from "../lib/reader";

/**
 * The end of the folio (design.md §5.1): a quiet slip in Tiro 18/28. What you kept and wrote to,
 * and today's passes with their undo. No streaks, no "come back tomorrow" pressure.
 */
export function FolioEndSlip({
	items,
	nextReleaseAt,
	onUndoPass,
}: {
	items: ReaderItem[];
	nextReleaseAt: string;
	onUndoPass: (item: ReaderItem) => void;
}) {
	const t = useTranslations("folio.end");
	const locale = useLocale();
	const { slug, abilities } = useHousehold();
	const kept = items.filter((item) => item.kept).length;
	const wrote = items.filter((item) => item.myLetter).length;
	const passed = items.filter((item) => item.state === "passed" && item.page);
	const tonight = isSameLocalDay(nextReleaseAt, new Date());

	return (
		<div className="max-md:border-x-0 mx-auto max-w-(--page-width) border border-border bg-card">
			<div aria-hidden="true" className="double-rule" />
			<div className="py-10 md:py-14 page-pad">
				<p className="max-w-[34em] font-display text-letter">
					{tonight
						? t("titleTonight", { time: formatTime(nextReleaseAt, locale) })
						: t("title")}
				</p>
				{(kept > 0 || wrote > 0) && (
					<Link
						href={`/${slug}/folio/kept`}
						className="mt-4 inline-block text-body text-seal-ink tabular underline-offset-4 hover:underline"
					>
						{t("summary", { kept, wrote })}
					</Link>
				)}
				{passed.length > 0 && abilities.canPass && (
					<section className="mt-8" aria-labelledby="passed-pages">
						<h2 id="passed-pages" className="hairline-after font-display text-section">
							{t("passed")}
						</h2>
						<ul className="mt-2">
							{passed.map((item) => (
								<li
									key={item.key}
									className="py-2 gap-4 flex items-center justify-between border-b border-border last:border-b-0"
								>
									<span className="font-display text-letter">
										{item.page?.header.displayName}
									</span>
									<Button
										variant="link"
										size="sm"
										onClick={() => onUndoPass(item)}
									>
										{t("undo")}
									</Button>
								</li>
							))}
						</ul>
						<p className="mt-3 text-meta text-muted-foreground">{t("passedNote")}</p>
					</section>
				)}
			</div>
		</div>
	);
}
