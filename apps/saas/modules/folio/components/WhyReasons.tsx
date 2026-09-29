"use client";

import { cn } from "@repo/ui";
import type { FitReason } from "@shared/lib/api-types";
import { useTranslations } from "next-intl";

import { useReasonText } from "../lib/reasons";

const GLYPH: Record<FitReason["verdict"], string> = {
	fits: "✓",
	gap: "~",
	unknown: "?",
};

/**
 * Two to six reasons, the reader's dealbreakers first (the server orders them). A glyph plus
 * words: colour is never the only signal (✓ fits · ~ a gap · ? not stated).
 */
export function WhyReasons({
	reasons,
	name,
	className,
	dense,
}: {
	reasons: FitReason[];
	name: string;
	className?: string;
	dense?: boolean;
}) {
	const t = useTranslations("why");
	const sentence = useReasonText();

	if (reasons.length === 0) {
		return <p className={cn("pencil text-body", className)}>{t("none")}</p>;
	}

	return (
		<ul className={cn("gap-2.5 flex flex-col", className)}>
			{reasons.map((reason) => (
				<li
					key={`${reason.key}-${reason.verdict}`}
					className={cn(
						"gap-2.5 grid grid-cols-[1.1rem_1fr]",
						dense ? "text-ui" : "text-body",
					)}
				>
					<span
						aria-hidden="true"
						className={cn(
							"text-center font-display",
							reason.verdict === "gap" ? "text-warning" : "text-foreground",
							reason.verdict === "unknown" && "text-muted-foreground",
						)}
					>
						{GLYPH[reason.verdict]}
					</span>
					<span className="text-foreground">
						<span className="sr-only">{t(`verdict.${reason.verdict}`)}: </span>
						{sentence(reason, name)}
					</span>
				</li>
			))}
		</ul>
	);
}

/** The first reason, inline, for the phone's 44px sheet handle. */
export function useFirstReason(reasons: FitReason[], name: string) {
	const sentence = useReasonText();
	const first = reasons[0];
	return first ? sentence(first, name) : null;
}
