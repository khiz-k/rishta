"use client";

import { useHousehold } from "@household/components/HouseholdProvider";
import { PencilNoteForm, PencilNotesList } from "@household/components/PencilNotes";
import { Button, cn, MonogramSeal } from "@repo/ui";
import { formatShortDate, isSameLocalDay } from "@shared/lib/format";
import { ChevronUpIcon, ShareIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";

import { canTakeBack, type ReaderItem, type ReaderMode } from "../lib/reader";
import { useFirstReason, WhyReasons } from "./WhyReasons";

export interface ReaderControlProps {
	item: ReaderItem;
	name: string;
	mode: ReaderMode;
	busy: boolean;
	onKeep: () => void;
	onPass: () => void;
	onWrite: () => void;
	onTakeBack: () => void;
	onFamily: () => void;
	onWhy: () => void;
	onNotesChanged: () => void;
	onUndoPass: () => void;
}

/** "You wrote to Arjun today", with your pressed seal. */
export function MyLetterLine({ item, name }: { item: ReaderItem; name: string }) {
	const t = useTranslations("folio.wrote");
	const locale = useLocale();
	const { candidateInitials, slug } = useHousehold();
	const letter = item.myLetter;
	if (!letter) {
		return null;
	}
	const today = isSameLocalDay(letter.createdAt, new Date());
	return (
		<div className="gap-3 flex items-center">
			<MonogramSeal initials={candidateInitials} state="pressed" size={40} />
			<div>
				<p className="font-display text-letter">
					{today
						? t("today", { name })
						: t("on", { name, date: formatShortDate(letter.createdAt, locale) })}
				</p>
				<Link
					href={`/${slug}/letters/${letter.letterId}`}
					className="text-meta text-seal-ink underline-offset-4 hover:underline"
				>
					{t(`state.${letter.state}`)}
				</Link>
			</div>
		</div>
	);
}

/** Keep · Kept ✓ · Keep for Priya · Unkeep, by role and reader. */
function useKeepLabel(item: ReaderItem, mode: ReaderMode) {
	const t = useTranslations("folio.actions");
	const { abilities, candidateFirstName } = useHousehold();
	if (mode === "kept") {
		return t("unkeep");
	}
	if (abilities.isCandidate) {
		return item.kept ? t("kept") : t("keep");
	}
	return item.kept
		? t("keptFor", { name: candidateFirstName })
		: t("keepFor", { name: candidateFirstName });
}

/**
 * The desktop margin (280px) beside the page: why this page, the household's pencil notes and
 * the answers. When the composer is open it takes the margin's place and the page stays
 * readable beside it.
 */
export function MarginColumn({
	composer,
	...props
}: ReaderControlProps & { composer: ReactNode | null }) {
	const t = useTranslations("folio");
	const { abilities, slug } = useHousehold();
	const { item, name, mode, busy } = props;
	const keepText = useKeepLabel(item, mode);

	if (composer) {
		return <div className="pt-1">{composer}</div>;
	}
	if (!item.page) {
		return null;
	}

	const passed = item.state === "passed";
	const letter = item.myLetter;

	return (
		<div className="gap-8 flex flex-col">
			<section aria-labelledby="margin-why">
				<h2
					id="margin-why"
					tabIndex={-1}
					className="label-caps text-muted-foreground outline-none"
				>
					{t("why.title")}
				</h2>
				<WhyReasons reasons={item.reasons} name={name} dense className="mt-3" />
				<p className="mt-3 text-meta text-muted-foreground">
					{t("why.footnote", { name })}
				</p>
				<Link
					href={`/${slug}/biodata/looking-for`}
					className="mt-1 inline-block text-meta text-seal-ink underline-offset-4 hover:underline"
				>
					{t("why.edit")} →
				</Link>
			</section>

			<section aria-labelledby="margin-pencil">
				<h2 id="margin-pencil" className="label-caps text-muted-foreground">
					{t("why.pencilTitle")}
				</h2>
				<PencilNotesList
					notes={item.pencilNotes}
					onChanged={props.onNotesChanged}
					className="mt-2"
				/>
				{abilities.canPencil && (
					<details className="mt-3 group">
						<summary className="min-h-9 flex cursor-pointer list-none items-center text-ui text-seal-ink underline-offset-4 hover:underline">
							{t("actions.pencil")}
						</summary>
						<div className="mt-3">
							<PencilNoteForm
								handle={item.page.handle}
								onAdded={props.onNotesChanged}
								compact
							/>
						</div>
					</details>
				)}
			</section>

			<section aria-label={t("actions.label")} className="gap-2 flex flex-col">
				{letter && <MyLetterLine item={item} name={name} />}
				{passed && (
					<p className="text-body text-muted-foreground">
						{t("pass.passedBefore")}{" "}
						<button
							type="button"
							onClick={props.onUndoPass}
							className="text-seal-ink underline-offset-4 hover:underline"
						>
							{t("pass.undo")}
						</button>
					</p>
				)}
				<div className="gap-2 grid grid-cols-2">
					{abilities.canKeep && (
						<Button
							size="sm"
							variant="outline"
							onClick={props.onKeep}
							disabled={busy}
							aria-pressed={mode !== "kept" ? item.kept : undefined}
							className={cn(
								abilities.canPass && mode === "folio" && !passed
									? ""
									: "col-span-2",
							)}
						>
							{keepText}
						</Button>
					)}
					{abilities.canPass && mode === "folio" && !passed && (
						<Button size="sm" variant="outline" onClick={props.onPass} disabled={busy}>
							{t("actions.pass")}
						</Button>
					)}
				</div>
				{abilities.isCandidate && item.theirLetterId && !letter && (
					<Button size="md" variant="primary" asChild>
						<Link href={`/${slug}/letters/${item.theirLetterId}`}>
							{t("actions.readTheirLetter", { name })}
						</Link>
					</Button>
				)}
				{abilities.isCandidate &&
					!item.theirLetterId &&
					(letter ? (
						canTakeBack(letter) && (
							<Button
								size="sm"
								variant="ghost"
								onClick={props.onTakeBack}
								disabled={busy}
							>
								{t("actions.takeBack")}
							</Button>
						)
					) : (
						<Button
							size="md"
							variant="primary"
							onClick={props.onWrite}
							disabled={!abilities.canSeal}
						>
							{t("actions.write")}
						</Button>
					))}
				{abilities.isCandidate && !abilities.canSeal && !letter && (
					<p className="text-meta text-muted-foreground">{t("actions.publishFirst")}</p>
				)}
				{abilities.canShare &&
					(item.familyLinksAllowed ? (
						<Button
							size="sm"
							variant="ghost"
							onClick={props.onFamily}
							className="px-0 justify-start"
						>
							<ShareIcon className="size-4" />
							{t("actions.family")}
						</Button>
					) : (
						<p className="text-meta text-muted-foreground">
							{t("actions.noFamilyLinks")}
						</p>
					))}
			</section>
		</div>
	);
}

/**
 * The phone's thumb-zone bars (design.md §4.2, §5.1): a 44px "Why this page" handle with the
 * first reason inline, above a 56px MarginBar of Keep · Pass · Write a note. "Write a note" is
 * the only filled button; guardians see Keep for Priya · Pencil a note; the composer and the
 * seal never render for anyone but the candidate.
 */
export function PhoneBars(props: ReaderControlProps & { onPencil: () => void }) {
	const t = useTranslations("folio");
	const { abilities, slug } = useHousehold();
	const { item, name, mode, busy } = props;
	const firstReason = useFirstReason(item.reasons, name);
	const keepText = useKeepLabel(item, mode);

	if (!item.page) {
		return null;
	}

	const passed = item.state === "passed";
	const letter = item.myLetter;
	// A cell grows to two lines rather than truncating: guardians read "Keep for Priya" at 130%
	// Android font scale on a 360px screen (design.md §14, no fixed heights on text).
	const cell =
		"h-auto min-h-(--bar-height) py-1.5 text-ui leading-tight min-w-0 flex-1 px-2 text-center font-semibold text-balance whitespace-normal [font-stretch:87.5%]";

	const cells: ReactNode[] = [];
	if (abilities.canKeep) {
		cells.push(
			<Button
				key="keep"
				variant="outline"
				onClick={props.onKeep}
				disabled={busy}
				aria-pressed={mode !== "kept" ? item.kept : undefined}
				className={cell}
			>
				{keepText}
			</Button>,
		);
	}
	if (abilities.canPass && mode === "folio") {
		cells.push(
			passed ? (
				<Button
					key="undo"
					variant="outline"
					onClick={props.onUndoPass}
					disabled={busy}
					className={cell}
				>
					{t("pass.undoShort")}
				</Button>
			) : (
				<Button
					key="pass"
					variant="outline"
					onClick={props.onPass}
					disabled={busy}
					className={cell}
				>
					{t("actions.pass")}
				</Button>
			),
		);
	}
	if (mode === "kept" && abilities.canShare && item.familyLinksAllowed) {
		cells.push(
			<Button key="family" variant="outline" onClick={props.onFamily} className={cell}>
				{t("actions.familyShort")}
			</Button>,
		);
	}
	if (abilities.isCandidate && item.theirLetterId && !letter) {
		cells.push(
			<Button key="theirs" variant="primary" asChild className={cn(cell, "flex-[1.35]")}>
				<Link href={`/${slug}/letters/${item.theirLetterId}`}>
					{t("actions.readLetterShort")}
				</Link>
			</Button>,
		);
	} else if (abilities.isCandidate) {
		if (letter) {
			if (canTakeBack(letter)) {
				cells.push(
					<Button
						key="take"
						variant="outline"
						onClick={props.onTakeBack}
						disabled={busy}
						className={cell}
					>
						{t("actions.takeBackShort")}
					</Button>,
				);
			}
		} else if (!abilities.canSeal) {
			cells.push(
				<Button key="publish" variant="outline" asChild className={cn(cell, "flex-[1.35]")}>
					<Link href={`/${slug}/biodata`}>{t("actions.publishShort")}</Link>
				</Button>,
			);
		} else {
			cells.push(
				<Button
					key="write"
					variant="primary"
					onClick={props.onWrite}
					className={cn(cell, "flex-[1.35]")}
				>
					{t("actions.write")}
				</Button>,
			);
		}
	} else {
		cells.push(
			<Button key="pencil" variant="outline" onClick={props.onPencil} className={cell}>
				{t("actions.pencil")}
			</Button>,
		);
	}

	return (
		<div className="lg:hidden bg-background">
			<button
				type="button"
				onClick={props.onWhy}
				className="px-4 gap-3 h-11 flex w-full items-center border-t border-border bg-card text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
			>
				<span className="min-w-0 flex-1 truncate text-meta">
					{firstReason ? t("why.handle", { reason: firstReason }) : t("why.title")}
				</span>
				<ChevronUpIcon
					className="size-4 shrink-0 text-muted-foreground"
					aria-hidden="true"
				/>
			</button>
			<div className="px-2 gap-2 py-0 flex border-t border-border bg-background">{cells}</div>
		</div>
	);
}
