import { cn, MonogramSeal } from "@repo/ui";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { LetterParagraph, LetterSection } from "./LetterSection";

/** Flat offset edges, no blur: one 2px edge per page still to read (design.md §9). */
const STACK_EDGES = [2, 4, 6]
	.map(
		(offset) =>
			`${offset}px ${offset}px 0 -1px var(--card), ${offset}px ${offset}px 0 0 var(--border)`,
	)
	.join(", ");

function Figure({ children, caption }: { children: ReactNode; caption: string }) {
	return (
		<figure className="mt-5">
			<div aria-hidden="true">{children}</div>
			<figcaption className="sr-only">{caption}</figcaption>
		</figure>
	);
}

/** The folio: a page on its stack, "3 of 7" at the edge. Never a dot per person. */
function FolioFigure({ label, count, caption }: { label: string; count: string; caption: string }) {
	return (
		<Figure caption={caption}>
			<div className="gap-6 flex items-center">
				<div
					className="w-28 shrink-0 border border-border bg-card"
					style={{ boxShadow: STACK_EDGES }}
				>
					<div className="double-rule" />
					<div className="px-3 py-3 space-y-2">
						<div className="h-2.5 w-16 bg-foreground/80" />
						<div className="h-1.5 w-12 bg-muted-foreground/50" />
						<div className="pt-1 space-y-1.5">
							<div className="h-px w-full bg-border" />
							<div className="h-1.5 w-20 bg-muted" />
							<div className="h-1.5 w-14 bg-muted" />
							<div className="h-1.5 w-18 bg-muted" />
						</div>
					</div>
				</div>
				<div>
					<p className="label-caps text-muted-foreground">{label}</p>
					<p className="mt-1 text-meta text-foreground tabular">{count}</p>
				</div>
			</div>
		</Figure>
	);
}

/** The note slip with its seal pressed: a sentence, not a tap. */
function NoteFigure({ note, hint, caption }: { note: string; hint: string; caption: string }) {
	return (
		<Figure caption={caption}>
			<div className="max-w-md gap-4 p-5 flex items-start border border-border bg-card">
				<p className="font-display text-body text-foreground">{note}</p>
				<MonogramSeal initials="Priya Shah" state="pressed" size={40} className="mt-1" />
			</div>
			<p className="mt-2 pencil text-meta">{hint}</p>
		</Figure>
	);
}

/** Both seals broken, and the first of three evenings set in both time zones. */
function IntroductionFigure({
	title,
	slot,
	caption,
}: {
	title: string;
	slot: string;
	caption: string;
}) {
	return (
		<Figure caption={caption}>
			<div className="gap-5 flex items-center">
				<div className="gap-1 flex shrink-0">
					<MonogramSeal initials="Priya Shah" state="broken" size={40} />
					<MonogramSeal initials="Arjun Mehta" state="broken" size={40} />
				</div>
				<div className="min-w-0">
					<p className="font-display text-body text-foreground">{title}</p>
					<p className="mt-0.5 text-meta text-muted-foreground tabular">{slot}</p>
				</div>
			</div>
		</Figure>
	);
}

export async function WhatWeMade() {
	const t = await getTranslations("home.made");

	const items: Array<{ key: string; title: string; body: string; figure: ReactNode }> = [
		{
			key: "folio",
			title: t("folio.title"),
			body: t("folio.body"),
			figure: (
				<FolioFigure
					label={t("folio.figure")}
					count={t("folio.count")}
					caption={t("folio.caption")}
				/>
			),
		},
		{
			key: "note",
			title: t("note.title"),
			body: t("note.body"),
			figure: (
				<NoteFigure
					note={t("note.figure")}
					hint={t("note.hint")}
					caption={t("note.caption")}
				/>
			),
		},
		{
			key: "seals",
			title: t("seals.title"),
			body: t("seals.body"),
			figure: (
				<IntroductionFigure
					title={t("seals.figure")}
					slot={t("seals.slot")}
					caption={t("seals.caption")}
				/>
			),
		},
	];

	return (
		<LetterSection id="what-we-made" heading={t("heading")}>
			<LetterParagraph>{t("intro")}</LetterParagraph>
			<ol className="mt-2 space-y-10">
				{items.map((item, index) => (
					<li key={item.key} className={cn("gap-4 grid grid-cols-[1.5rem_1fr]")}>
						<span className="pt-1 text-meta text-muted-foreground tabular">
							{index + 1}.
						</span>
						<div>
							<LetterParagraph>
								<strong className="font-normal mr-[0.1em] text-foreground italic">
									{item.title}
								</strong>{" "}
								{item.body}
							</LetterParagraph>
							{item.figure}
						</div>
					</li>
				))}
			</ol>
		</LetterSection>
	);
}
