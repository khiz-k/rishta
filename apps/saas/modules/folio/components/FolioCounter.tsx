"use client";

import { cn } from "@repo/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/** The folio's evening in the open page's own script ("शुक्रवार"), set beside the title. */
export interface ScriptDay {
	text: string;
	lang: string;
	dir: "ltr" | "rtl";
}

function ScriptDayLine({ day, className }: { day: ScriptDay; className?: string }) {
	return (
		<span
			lang={day.lang}
			dir={day.dir}
			className={cn("font-display text-muted-foreground", className)}
		>
			{day.text}
		</span>
	);
}

/** "‹ 3 of 7 ›": the only position marker. Never a dot per profile. */
export function FolioCounter({
	label,
	onPrevious,
	onNext,
	canPrevious,
	canNext,
	title,
	scriptDay,
	summary,
	layout,
}: {
	label: string;
	onPrevious: () => void;
	onNext: () => void;
	canPrevious: boolean;
	canNext: boolean;
	title?: string;
	/** The evening named again in the page's script, when the open page is not in English. */
	scriptDay?: ScriptDay | null;
	summary?: ReactNode;
	layout: "rail" | "row";
}) {
	const t = useTranslations("folio");
	const chevron =
		"size-11 inline-flex shrink-0 items-center justify-center text-foreground transition-colors hover:bg-accent disabled:cursor-default disabled:text-muted-foreground/40 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-ring";

	const controls = (
		<div className="flex items-center">
			<button
				type="button"
				onClick={onPrevious}
				disabled={!canPrevious}
				aria-label={t("previous")}
				className={chevron}
			>
				<ChevronLeftIcon />
			</button>
			<span className="px-1 font-semibold min-w-[4.5rem] text-center text-ui [font-stretch:87.5%] tabular">
				{label}
			</span>
			<button
				type="button"
				onClick={onNext}
				disabled={!canNext}
				aria-label={t("next")}
				className={chevron}
			>
				<ChevronRightIcon />
			</button>
		</div>
	);

	if (layout === "row") {
		return (
			<div data-print-hide className="px-2 flex items-center justify-between">
				{title && (
					<p className="pl-2 truncate font-display text-letter">
						{title}
						{scriptDay && (
							<>
								<span aria-hidden="true" className="text-muted-foreground">
									{" · "}
								</span>
								<ScriptDayLine day={scriptDay} />
							</>
						)}
					</p>
				)}
				{controls}
			</div>
		);
	}

	return (
		<div data-print-hide className={cn("gap-2 flex flex-col items-start")}>
			<div className="-ml-3">{controls}</div>
			{title && (
				<div>
					<p className="font-display text-letter">{title}</p>
					{scriptDay && (
						<p className="mt-0.5">
							<ScriptDayLine day={scriptDay} className="text-letter" />
						</p>
					)}
				</div>
			)}
			{summary && <div className="text-meta text-muted-foreground tabular">{summary}</div>}
		</div>
	);
}
