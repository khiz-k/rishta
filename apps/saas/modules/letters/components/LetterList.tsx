"use client";

import { useHousehold } from "@household/components/HouseholdProvider";
import { Badge, Button, cn, PencilMark } from "@repo/ui";
import { RowsSkeleton } from "@shared/components/PaperSkeleton";
import { PaperSlip } from "@shared/components/PaperSlip";
import type { LetterSummary } from "@shared/lib/api-types";
import { isInteractiveTarget } from "@shared/lib/interactive-target";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQueries } from "@tanstack/react-query";
import { FlagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { type KeyboardEvent, useRef } from "react";

import { useLetterWords } from "../lib/letter-words";

const BOXES = ["waiting", "introductions", "sent", "closed"] as const;
type Box = (typeof BOXES)[number];

/**
 * One letter as a line between hairlines, never a card: the name in Tiro, the state in words,
 * the note's first line in Tiro italic, and disclosed labels. No photos in rows (discretion at
 * lunch).
 */
function LetterRow({
	letter,
	active,
	href,
}: {
	letter: LetterSummary;
	active: boolean;
	href: string;
}) {
	const t = useTranslations("letters");
	const words = useLetterWords();
	return (
		<li className="border-b border-border">
			<Link
				href={href}
				data-letter-row
				aria-current={active ? "page" : undefined}
				className={cn(
					"py-3.5 px-4 lg:px-5 block transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
					active ? "bg-card" : "hover:bg-accent/60",
				)}
			>
				<span className="gap-x-2 gap-y-1 flex flex-wrap items-baseline">
					<span className="font-display text-letter text-foreground">
						{letter.otherName}
					</span>
					{letter.otherAge !== null && (
						<span className="text-meta text-muted-foreground tabular">
							{letter.otherAge}
							{letter.otherCity ? ` · ${letter.otherCity}` : ""}
						</span>
					)}
				</span>
				<span className="mt-0.5 gap-2 flex flex-wrap items-center text-meta text-muted-foreground">
					<span>{words(letter)}</span>
					{letter.isPriority && <Badge status="info">{t("priority")}</Badge>}
					{letter.safetyFlag && (
						<span className="gap-1 inline-flex items-center label-caps text-warning">
							<FlagIcon className="size-3.5" aria-hidden="true" />
							{t("takeCare")}
						</span>
					)}
					{letter.hasFamilyReaction && (
						<span className="gap-1 inline-flex items-center">
							<PencilMark kind="proceed" className="size-3.5" />
							<span className="sr-only">{t("familyReacted")}</span>
						</span>
					)}
				</span>
				{letter.firstLine && (
					<span className="mt-1 line-clamp-1 block pencil text-body">
						“{letter.firstLine}”
					</span>
				)}
			</Link>
		</li>
	);
}

/**
 * Letters (design.md §5.4): Waiting for your answer (oldest first; priority notes pinned for 48
 * hours and labelled), Introductions, Your sealed notes, Closed (collapsed). Family members see
 * that the letters are private, and stage lines only if the candidate allows it.
 */
export function LetterList() {
	const t = useTranslations("letters");
	const { organizationId, slug, abilities, candidateFirstName, household } = useHousehold();
	const params = useParams<{ letterId?: string }>();
	const listRef = useRef<HTMLDivElement>(null);
	const canRead = abilities.canReadLetters;
	const stageLines = !canRead && household.settings.familySeesIntroductions;

	const queries = useQueries({
		queries: BOXES.map((box) => ({
			...orpc.interests.list.queryOptions({ input: { organizationId, box } }),
			enabled: canRead || (stageLines && box === "introductions"),
			refetchOnWindowFocus: true,
			refetchInterval: 60_000,
		})),
	});

	const byBox = Object.fromEntries(
		BOXES.map((box, index) => [box, queries[index]?.data ?? []]),
	) as Record<Box, LetterSummary[]>;
	const loading = queries.some((query, index) => {
		const box = BOXES[index];
		const enabled = canRead || (stageLines && box === "introductions");
		return enabled && query.isPending;
	});
	const failed = queries.some((query) => query.isError);

	// ↑ / ↓ move between letters, Enter opens (design.md §4.4). A letter row is the list's own
	// item; any other control inside the list keeps its keys (quality rule A1).
	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
			return;
		}
		if (
			event.defaultPrevented ||
			event.altKey ||
			event.ctrlKey ||
			event.metaKey ||
			event.shiftKey ||
			isInteractiveTarget(event.target, {
				ownItem: (element) => element.hasAttribute("data-letter-row"),
			})
		) {
			return;
		}
		const rows = Array.from(
			listRef.current?.querySelectorAll<HTMLAnchorElement>("[data-letter-row]") ?? [],
		).filter((row) => row.offsetParent !== null);
		const index = rows.findIndex((row) => row === document.activeElement);
		const next = event.key === "ArrowDown" ? index + 1 : index - 1;
		const target = rows[Math.max(0, Math.min(rows.length - 1, index < 0 ? 0 : next))];
		if (target) {
			event.preventDefault();
			target.focus();
		}
	};

	if (!canRead && !stageLines) {
		return (
			<div className="p-4 lg:p-5">
				<PaperSlip title={t("private", { name: candidateFirstName })}>
					{t("privateNote", { name: candidateFirstName })}
				</PaperSlip>
			</div>
		);
	}

	if (loading) {
		return <RowsSkeleton rows={5} className="px-4 lg:px-5" />;
	}

	if (failed && BOXES.every((box) => byBox[box].length === 0)) {
		return (
			<div className="p-4 lg:p-5">
				<PaperSlip
					role="alert"
					title={t("error")}
					actions={
						<Button
							variant="secondary"
							onClick={() => queries.forEach((query) => void query.refetch())}
						>
							{t("tryAgain")}
						</Button>
					}
				/>
			</div>
		);
	}

	const total = BOXES.reduce((sum, box) => sum + byBox[box].length, 0);
	if (total === 0) {
		return (
			<div className="p-4 lg:p-5">
				<PaperSlip title={stageLines ? t("noIntroductions") : t("empty")} />
			</div>
		);
	}

	const href = (letter: LetterSummary) => `/${slug}/letters/${letter.letterId}`;

	const section = (box: Box, rows: LetterSummary[], emptyLine?: string) => (
		<section key={box} aria-labelledby={`box-${box}`}>
			<h2
				id={`box-${box}`}
				className="px-4 lg:px-5 pt-6 pb-2 border-b border-border label-caps text-muted-foreground"
			>
				{t(`boxes.${box}`)}
			</h2>
			{rows.length > 0 ? (
				<ul>
					{rows.map((letter) => (
						<LetterRow
							key={letter.letterId}
							letter={letter}
							href={href(letter)}
							active={params?.letterId === letter.letterId}
						/>
					))}
				</ul>
			) : emptyLine ? (
				<p className="px-4 lg:px-5 py-4 border-b border-border pencil text-body">
					{emptyLine}
				</p>
			) : null}
		</section>
	);

	return (
		<div ref={listRef} role="group" aria-label={t("title")} onKeyDown={onKeyDown}>
			{stageLines && (
				<p className="px-4 lg:px-5 pt-5 text-meta text-muted-foreground">
					{t("stageLinesNote", { name: candidateFirstName })}
				</p>
			)}
			{canRead && section("waiting", byBox.waiting, t("nothingWaiting"))}
			{(canRead || byBox.introductions.length > 0) &&
				section("introductions", byBox.introductions)}
			{canRead && byBox.sent.length > 0 && section("sent", byBox.sent)}
			{canRead && byBox.closed.length > 0 && (
				<details className="group">
					<summary className="px-4 lg:px-5 pt-6 pb-2 flex cursor-pointer list-none items-center justify-between border-b border-border label-caps text-muted-foreground">
						{t("boxes.closedCount", { count: byBox.closed.length })}
						<span
							aria-hidden="true"
							className="transition-transform group-open:rotate-180 motion-reduce:transition-none"
						>
							▾
						</span>
					</summary>
					<ul>
						{byBox.closed.map((letter) => (
							<LetterRow
								key={letter.letterId}
								letter={letter}
								href={href(letter)}
								active={params?.letterId === letter.letterId}
							/>
						))}
					</ul>
				</details>
			)}
		</div>
	);
}
