"use client";

import { Badge, cn, MonogramSeal, VerifiedMark } from "@repo/ui";
import type { LetterDetail } from "@shared/lib/api-types";
import { formatDateTime } from "@shared/lib/format";
import { FlagIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * The note, clipped to the top of its page (it overlaps the page by 12px): the salutation, the
 * words in Tiro, the pressed seal of the writer and the signer line. A priority note is always
 * labelled.
 */
export function NoteSlip({
	note,
	salutationName,
	signerName,
	signerInitials,
	verification,
	sealedAt,
	priority,
	dimmed,
	footer,
}: {
	note: string;
	salutationName: string;
	signerName: string;
	/** The writer's monogram, from their page name ("AM" for Arjun Mehta). */
	signerInitials: string;
	verification: LetterDetail["signer"]["verification"];
	sealedAt: string;
	priority?: boolean;
	dimmed?: boolean;
	footer?: ReactNode;
}) {
	const t = useTranslations("letters.note");
	const tPage = useTranslations("page.verified");
	const locale = useLocale();

	return (
		<figure
			className={cn(
				"mx-3 md:mx-6 -mb-3 px-5 md:px-7 pt-5 pb-4 relative z-10 border border-border bg-popover transition-opacity duration-(--dur-turn)",
				dimmed && "opacity-60",
			)}
		>
			{priority && (
				<Badge status="info" className="mb-3">
					{t("priority")}
				</Badge>
			)}
			<p className="font-display text-letter italic">
				{t("salutation", { name: salutationName })}
			</p>
			<blockquote className="mt-2 max-w-[36em] font-display text-letter whitespace-pre-line text-foreground">
				{note}
			</blockquote>
			<div className="mt-3 gap-4 flex items-end justify-between">
				<figcaption className="text-meta text-muted-foreground">
					<span className="font-display text-body text-foreground not-italic">
						{t("signer", { name: signerName })}
					</span>
					<span className="mt-1 gap-x-2 flex flex-wrap items-center">
						{verification !== "none" && (
							<VerifiedMark>{tPage(verification)}</VerifiedMark>
						)}
						<span className="tabular">{formatDateTime(sealedAt, locale)}</span>
					</span>
				</figcaption>
				<MonogramSeal
					initials={signerInitials}
					state="pressed"
					size={40}
					title={t("sealOf", { name: signerName })}
				/>
			</div>
			{footer}
		</figure>
	);
}

type SafetyCategory = NonNullable<LetterDetail["safetyFlag"]>["category"];

/**
 * A safety flag, shown to the recipient only (spec.md §9d): the reason in words and two actions.
 * Nothing is hidden and the writer is never told.
 */
export function SafetyNote({
	category,
	onReport,
	onBlock,
	compact,
}: {
	category: SafetyCategory;
	onReport: () => void;
	onBlock?: () => void;
	compact?: boolean;
}) {
	const t = useTranslations("letters.safety");
	return (
		<div
			role="note"
			className={cn(
				"border border-warning bg-card",
				compact ? "px-3 py-2" : "mx-3 md:mx-6 mb-5 px-4 py-3",
			)}
		>
			<p className="gap-2 flex items-start text-body">
				<FlagIcon className="mt-1 size-4 shrink-0 text-warning" aria-hidden="true" />
				<span>
					<span className="font-semibold">{t("takeCare")}</span> {t(`reason.${category}`)}{" "}
					{!compact && t("sealedPromise")}
				</span>
			</p>
			<div className="mt-1 gap-5 pl-6 flex">
				<button
					type="button"
					onClick={onReport}
					className="min-h-11 text-ui text-seal-ink underline-offset-4 hover:underline"
				>
					{t("report")}
				</button>
				{onBlock && (
					<button
						type="button"
						onClick={onBlock}
						className="min-h-11 text-ui text-seal-ink underline-offset-4 hover:underline"
					>
						{t("block")}
					</button>
				)}
			</div>
		</div>
	);
}
