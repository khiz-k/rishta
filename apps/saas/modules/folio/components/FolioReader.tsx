"use client";

import { BiodataPage } from "@biodata/components/BiodataPage";
import { FamilyLinkDialog } from "@household/components/FamilyLinkDialog";
import { useHousehold } from "@household/components/HouseholdProvider";
import { SealComposer } from "@letters/components/SealComposer";
import { SealComposerSheet } from "@letters/components/SealComposerSheet";
import type { PageLanguage, PassReason } from "@repo/database/drizzle/domain";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	cn,
	toast,
} from "@repo/ui";
import { PaperSlip } from "@shared/components/PaperSlip";
import { BottomSlot, useShellContextLine } from "@shared/components/shell/ShellContext";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import { useReducedMotion } from "@shared/hooks/use-reduced-motion";
import { firstNameOf } from "@shared/lib/format";
import { useTranslations } from "next-intl";
import { parseAsInteger, useQueryState } from "nuqs";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ReaderItem, ReaderMode } from "../lib/reader";
import { usePageSwipe } from "../lib/use-page-swipe";
import { useReaderActions } from "../lib/use-reader-actions";
import { useReaderKeys } from "../lib/use-reader-keys";
import { FolioCounter } from "./FolioCounter";
import { PassSlip } from "./PassSlip";
import { MarginColumn, MyLetterLine, PhoneBars } from "./ReaderControls";
import { WhyThisPageSheet } from "./WhyThisPageSheet";

export interface FolioReaderProps {
	items: ReaderItem[];
	mode: ReaderMode;
	/** "Friday folio", "Kept pages". */
	title: string;
	/**
	 * The folio's evening in a page's own language ("शुक्रवार"), or null for English. Shown beside
	 * the title while that page is open, so the page's script leads the rail, not only the page.
	 */
	scriptDay?: (language: PageLanguage) => string | null;
	/** "3 of 7" or "Kept · 2 of 5". */
	counterLabel: (position: number, total: number) => string;
	/** The last position after the pages (the folio end slip). */
	renderEnd?: (props: {
		items: ReaderItem[];
		onUndoPass: (item: ReaderItem) => void;
	}) => ReactNode;
	/** A quiet line in the rail under the title ("Kept 1 · Wrote 1"). */
	railSummary?: (items: ReaderItem[]) => ReactNode;
}

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

/**
 * The paginated reader (design.md §3.1, §5.1): complete biodata pages one at a time. A page is
 * scrolled top to bottom and turned with a swipe, ← →, or the chevrons; turning never answers
 * it. Keep toggles in place, Pass turns and leaves an undo slip, Write a note opens the seal
 * composer (in the margin on desktop, in a sheet on the phone).
 */
export function FolioReader({
	items,
	mode,
	title,
	scriptDay,
	counterLabel,
	renderEnd,
	railSummary,
}: FolioReaderProps) {
	const t = useTranslations("folio");
	const { abilities, keyboardShortcuts } = useHousehold();
	const reducedMotion = useReducedMotion();
	const isDesktop = useMediaQuery("(min-width: 1024px)");
	const actions = useReaderActions();

	const [positionParam, setPositionParam] = useQueryState(
		"p",
		parseAsInteger.withDefault(1).withOptions({ history: "replace", scroll: false }),
	);
	const [overrides, setOverrides] = useState<Record<string, Partial<ReaderItem>>>({});
	const [direction, setDirection] = useState<"next" | "prev" | null>(null);
	const [announcement, setAnnouncement] = useState("");
	const [composerOpen, setComposerOpen] = useState(false);
	const [whyOpen, setWhyOpen] = useState(false);
	const [whyPencil, setWhyPencil] = useState(false);
	const [familyOpen, setFamilyOpen] = useState(false);
	const [takeBackOpen, setTakeBackOpen] = useState(false);
	const [passSlip, setPassSlip] = useState<ReaderItem | null>(null);
	const [busy, setBusy] = useState(false);
	const pageRef = useRef<HTMLDivElement>(null);
	const marginRef = useRef<HTMLDivElement>(null);

	/**
	 * Local overrides bridge a round trip only: each is cleared once its own action has settled
	 * and the fresh pages have arrived, so a background refetch never flickers an answer back.
	 */
	const settle = useCallback((key: string) => {
		setOverrides((previous) => {
			const { [key]: _settled, ...rest } = previous;
			return rest;
		});
	}, []);

	const merged = useMemo(
		() => items.map((item) => ({ ...item, ...overrides[item.key] })),
		[items, overrides],
	);

	const total = merged.length;
	const hasEnd = Boolean(renderEnd);
	const maxPosition = Math.max(1, total + (hasEnd ? 1 : 0));
	const position = clamp(positionParam, 1, maxPosition);
	const current: ReaderItem | null = position <= total ? (merged[position - 1] ?? null) : null;
	const openPage = current?.page ?? null;
	const openDay = openPage && scriptDay ? scriptDay(openPage.language) : null;
	const currentScriptDay =
		openPage && openDay ? { text: openDay, lang: openPage.language, dir: openPage.dir } : null;
	const name = current?.page ? firstNameOf(current.page.header.displayName) : "";
	const atEnd = !current && hasEnd;
	const label = atEnd ? t("endLabel") : counterLabel(position, total);

	useShellContextLine(mode === "single" ? label : `${title} · ${label}`);

	const override = useCallback((key: string, patch: Partial<ReaderItem>) => {
		setOverrides((previous) => ({ ...previous, [key]: { ...previous[key], ...patch } }));
	}, []);

	const turn = useCallback(
		(delta: number) => {
			const next = clamp(position + delta, 1, maxPosition);
			if (next === position) {
				return;
			}
			setDirection(delta > 0 ? "next" : "prev");
			setComposerOpen(false);
			void setPositionParam(next);
			window.scrollTo({ top: 0, behavior: "instant" });
			const nextItem = next <= total ? merged[next - 1] : null;
			setAnnouncement(
				nextItem?.page
					? t("announce", {
							position: next,
							total,
							name: nextItem.page.header.displayName,
						})
					: nextItem
						? t("closedPage")
						: t("announceEnd"),
			);
		},
		[position, maxPosition, total, merged, setPositionParam, t],
	);

	const previous = useCallback(() => turn(-1), [turn]);
	const next = useCallback(() => turn(1), [turn]);

	// Opening a page records a read (unless the household reads privately; the server decides).
	useEffect(() => {
		if (mode === "folio" && current?.state === "unread" && current.page) {
			override(current.key, { state: "read" });
			actions.markRead(current);
		}
	}, [current?.key]); // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps

	const runBusy = useCallback(
		async (task: () => Promise<void>) => {
			setBusy(true);
			try {
				await task();
			} catch {
				toast({ title: t("actionFailed"), type: "error" });
			} finally {
				setBusy(false);
			}
		},
		[t],
	);

	const onKeep = useCallback(() => {
		if (!current?.page || !abilities.canKeep) {
			return;
		}
		const item = current;
		const nextKept = mode === "kept" ? false : !item.kept;
		override(item.key, {
			kept: nextKept,
			state: nextKept ? "kept" : item.state === "kept" ? "read" : item.state,
		});
		void runBusy(async () => {
			try {
				await actions.setKept(item, nextKept);
				settle(item.key);
			} catch (error) {
				override(item.key, { kept: item.kept, state: item.state });
				throw error;
			}
		});
	}, [current, abilities.canKeep, mode, override, settle, runBusy, actions]);

	const onPass = useCallback(() => {
		if (
			!current?.page ||
			!abilities.canPass ||
			mode !== "folio" ||
			current.state === "passed"
		) {
			return;
		}
		const item = current;
		override(item.key, { state: "passed", kept: false });
		setPassSlip(item);
		turn(1);
		void runBusy(async () => {
			try {
				await actions.pass(item);
				settle(item.key);
			} catch (error) {
				override(item.key, { state: item.state, kept: item.kept });
				setPassSlip(null);
				throw error;
			}
		});
	}, [current, abilities.canPass, mode, override, settle, turn, runBusy, actions]);

	const undoPass = useCallback(
		(item: ReaderItem) => {
			override(item.key, { state: "read" });
			setPassSlip(null);
			void runBusy(async () => {
				await actions.undoPass(item);
				settle(item.key);
			});
		},
		[override, settle, runBusy, actions],
	);

	const setPassReason = useCallback(
		(item: ReaderItem, reason: PassReason) => {
			void runBusy(async () => {
				await actions.pass(item, reason);
			});
		},
		[runBusy, actions],
	);

	const onWrite = useCallback(() => {
		if (!current?.page || !abilities.canSeal || current.myLetter) {
			return;
		}
		setComposerOpen(true);
	}, [current, abilities.canSeal]);

	const onWhy = useCallback(() => {
		if (!current?.page) {
			return;
		}
		if (isDesktop) {
			marginRef.current?.querySelector<HTMLElement>("#margin-why")?.focus();
			marginRef.current?.scrollIntoView({
				block: "start",
				behavior: reducedMotion ? "auto" : "smooth",
			});
			return;
		}
		setWhyPencil(false);
		setWhyOpen(true);
	}, [current, isDesktop, reducedMotion]);

	const onFamily = useCallback(() => {
		if (current?.page && abilities.canShare && current.familyLinksAllowed) {
			setFamilyOpen(true);
		}
	}, [current, abilities.canShare]);

	const onSent = useCallback(
		(letterId: string) => {
			if (!current) {
				return;
			}
			override(current.key, {
				state: "noted",
				myLetter: {
					letterId,
					state: "waiting_for_them",
					isPriority: false,
					createdAt: new Date().toISOString(),
				},
			});
			setComposerOpen(false);
			toast({ title: t("sealed", { name }) });
			const key = current.key;
			void actions.refresh().then(() => settle(key));
		},
		[current, override, settle, actions, t, name],
	);

	const takeBack = useCallback(() => {
		const letterId = current?.myLetter?.letterId;
		if (!current || !letterId) {
			return;
		}
		const item = current;
		override(item.key, { myLetter: null, state: "read" });
		void runBusy(async () => {
			try {
				await actions.takeBack(letterId);
				settle(item.key);
				toast({ title: t("tookBack") });
			} catch (error) {
				override(item.key, { myLetter: item.myLetter, state: item.state });
				throw error;
			}
		});
	}, [current, runBusy, actions, override, settle, t]);

	useReaderKeys(
		{
			previous,
			next,
			keep: onKeep,
			pass: onPass,
			write: onWrite,
			why: onWhy,
			family: onFamily,
		},
		keyboardShortcuts,
	);

	const swipe = usePageSwipe({
		targetRef: pageRef,
		onPrevious: previous,
		onNext: next,
		reducedMotion,
		disabled: composerOpen && !isDesktop,
	});

	const controls = current
		? {
				item: current,
				name,
				mode,
				busy,
				onKeep,
				onPass,
				onWrite,
				onTakeBack: () => setTakeBackOpen(true),
				onFamily,
				onWhy,
				onNotesChanged: () => void actions.refresh(),
				onUndoPass: () => undoPass(current),
			}
		: null;

	const remaining = mode === "single" ? 0 : Math.max(0, total - position);
	const turnClass =
		direction === "next"
			? "animate-turn-next"
			: direction === "prev"
				? "animate-turn-prev"
				: "";

	return (
		<section
			aria-roledescription={t("roleDescription")}
			aria-label={title}
			className="md:px-6 lg:px-10 pt-3 md:pt-6 lg:pt-10 max-lg:pb-28 lg:grid lg:grid-cols-[minmax(9rem,1fr)_minmax(0,var(--page-width))_var(--margin-width)] lg:gap-x-10 xl:gap-x-16 mx-auto max-w-[1440px]"
		>
			<p className="sr-only" aria-live="polite" aria-atomic="true">
				{announcement}
			</p>

			<aside className="lg:block hidden">
				<div
					className={cn(
						"sticky top-[calc(var(--masthead-height)+2.5rem)]",
						mode === "single" && "hidden",
					)}
				>
					<FolioCounter
						layout="rail"
						label={label}
						title={title}
						scriptDay={currentScriptDay}
						summary={railSummary?.(merged)}
						onPrevious={previous}
						onNext={next}
						canPrevious={position > 1}
						canNext={position < maxPosition}
					/>
				</div>
			</aside>

			<div className="min-w-0">
				<div
					className={cn(
						"mb-4 md:flex lg:hidden hidden",
						mode === "single" && "md:hidden",
					)}
				>
					<FolioCounter
						layout="row"
						label={label}
						title={title}
						scriptDay={currentScriptDay}
						onPrevious={previous}
						onNext={next}
						canPrevious={position > 1}
						canNext={position < maxPosition}
					/>
				</div>

				<div
					ref={pageRef}
					onPointerDown={swipe.onPointerDown}
					onPointerMove={swipe.onPointerMove}
					onPointerUp={swipe.onPointerUp}
					onPointerCancel={swipe.onPointerCancel}
					className="[touch-action:pan-y]"
				>
					<div key={current?.key ?? "end"} className={turnClass}>
						{current ? (
							current.page ? (
								<>
									{current.state === "passed" && (
										<p className="mb-3 px-4 md:px-0 text-body text-muted-foreground">
											{t("pass.passedBefore")}{" "}
											<button
												type="button"
												onClick={() => undoPass(current)}
												className="min-h-11 text-seal-ink underline-offset-4 hover:underline"
											>
												{t("pass.undo")}
											</button>
										</p>
									)}
									<BiodataPage
										page={current.page}
										seenBefore={current.seenBefore}
										stackEdges={remaining}
										className={cn(
											"max-md:border-l-0",
											// Phones: the page would be flush with the screen edge, which
											// would push the stack edges (the "3 of 7" cue) off-screen.
											mode === "single"
												? "max-md:border-r-0"
												: "max-md:ml-0 max-md:w-[calc(100%_-_var(--stack-offset)_*_3)]",
										)}
										overline={
											current.keptBy ? (
												<p className="label-caps text-muted-foreground">
													{t("keptBy", { name: current.keptBy })}
												</p>
											) : undefined
										}
										sealedLead={
											current.myLetter ? (
												<MyLetterLine item={current} name={name} />
											) : undefined
										}
									/>
								</>
							) : (
								<PaperSlip
									title={t("closedPage")}
									className="mx-4 md:mx-0 max-w-(--page-width)"
								/>
							)
						) : (
							renderEnd?.({ items: merged, onUndoPass: undoPass })
						)}
					</div>
				</div>

				<div
					className={cn(
						"mt-4 px-2 md:hidden flex items-center justify-between",
						mode === "single" && "hidden",
					)}
				>
					<FolioCounter
						layout="row"
						label={label}
						onPrevious={previous}
						onNext={next}
						canPrevious={position > 1}
						canNext={position < maxPosition}
					/>
				</div>
			</div>

			<aside ref={marginRef} className="lg:block hidden" aria-label={t("marginLabel")}>
				{/* -ml-1 pl-1: room for the 2px focus ring, which the scroll box would otherwise clip. */}
				<div className="-ml-1 pl-1 pr-1 pb-8 sticky top-[calc(var(--masthead-height)+2.5rem)] max-h-[calc(100dvh-var(--masthead-height)-3.5rem)] overflow-y-auto">
					{controls && (
						<MarginColumn
							{...controls}
							composer={
								composerOpen && isDesktop && current?.page ? (
									<SealComposer
										handle={current.page.handle}
										recipientFirstName={name}
										variant="margin"
										onClose={() => setComposerOpen(false)}
										onSent={onSent}
									/>
								) : null
							}
						/>
					)}
				</div>
			</aside>

			{controls && current?.page && (
				<BottomSlot>
					<div className={cn("lg:hidden")}>
						<PhoneBars
							{...controls}
							onPencil={() => {
								setWhyPencil(true);
								setWhyOpen(true);
							}}
						/>
					</div>
				</BottomSlot>
			)}

			{passSlip && (
				<div className="inset-x-0 px-3 lg:bottom-6 pointer-events-none fixed bottom-[calc(var(--bar-height)*2+2.75rem+env(safe-area-inset-bottom)+0.5rem)] z-40 flex justify-center">
					<div className="max-w-md pointer-events-auto w-full">
						<PassSlip
							name={
								passSlip.page ? firstNameOf(passSlip.page.header.displayName) : ""
							}
							onUndo={() => {
								const item = passSlip;
								undoPass(item);
								const index = merged.findIndex((entry) => entry.key === item.key);
								if (index >= 0) {
									setDirection("prev");
									void setPositionParam(index + 1);
								}
							}}
							onReason={(reason) => setPassReason(passSlip, reason)}
							onDismiss={() => setPassSlip(null)}
						/>
					</div>
				</div>
			)}

			{current?.page && (
				<>
					{!isDesktop && (
						<SealComposerSheet
							open={composerOpen}
							onOpenChange={setComposerOpen}
							handle={current.page.handle}
							recipientFirstName={name}
							onSent={onSent}
						/>
					)}
					<WhyThisPageSheet
						open={whyOpen}
						onOpenChange={setWhyOpen}
						item={current}
						name={name}
						focusPencil={whyPencil}
						onNotesChanged={() => void actions.refresh()}
						onFamily={() => {
							setWhyOpen(false);
							setFamilyOpen(true);
						}}
					/>
					<FamilyLinkDialog
						open={familyOpen}
						onOpenChange={setFamilyOpen}
						handle={current.page.handle}
						pageName={name}
						familyLinksAllowed={current.familyLinksAllowed}
					/>
					<AlertDialog open={takeBackOpen} onOpenChange={setTakeBackOpen}>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>{t("takeBack.title", { name })}</AlertDialogTitle>
								<AlertDialogDescription>
									{t("takeBack.body", { name })}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>{t("takeBack.cancel")}</AlertDialogCancel>
								<AlertDialogAction onClick={takeBack}>
									{t("takeBack.confirm")}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</>
			)}
		</section>
	);
}
