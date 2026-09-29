"use client";

import { BiodataPage } from "@biodata/components/BiodataPage";
import { useFirstReason, WhyReasons } from "@folio/components/WhyReasons";
import { WhyThisPageSheet } from "@folio/components/WhyThisPageSheet";
import type { ReaderItem } from "@folio/lib/reader";
import { BlockDialog } from "@household/components/BlockDialog";
import { FamilyLinkDialog } from "@household/components/FamilyLinkDialog";
import { useHousehold } from "@household/components/HouseholdProvider";
import { PencilNotesList } from "@household/components/PencilNotes";
import { ReportDialog } from "@household/components/ReportDialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	cn,
	sealInitials,
	Skeleton,
} from "@repo/ui";
import { PaperSkeleton } from "@shared/components/PaperSkeleton";
import { PaperSlip } from "@shared/components/PaperSlip";
import { BottomSlot, useShellContextLine } from "@shared/components/shell/ShellContext";
import { useRouter } from "@shared/hooks/router";
import type { LetterDetail } from "@shared/lib/api-types";
import { errorStatus, knownErrorCode } from "@shared/lib/errors";
import { firstNameOf, formatDateTime } from "@shared/lib/format";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronUpIcon, ShareIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useState } from "react";

import { useLetterWords } from "../lib/letter-words";
import { DeclineSheet, SayYesSheet } from "./AnswerSheets";
import { IntroductionLetter } from "./IntroductionLetter";
import { NoteSlip, SafetyNote } from "./NoteSlip";

function asReaderItem(detail: LetterDetail): ReaderItem {
	return {
		key: detail.letter.letterId,
		folioPageId: null,
		page: detail.otherPage,
		reasons: detail.reasons,
		pencilNotes: detail.pencilNotes,
		kept: false,
		state: null,
		passReason: null,
		seenBefore: false,
		myLetter: null,
		keptBy: null,
		familyLinksAllowed: true,
	};
}

function LetterSkeleton() {
	return (
		<div className="md:px-6 lg:px-8 pt-4 md:pt-8" aria-hidden="true">
			<div className="animate-paper-appear mx-3 md:mx-6 -mb-3 p-6 relative z-10 border border-border bg-popover">
				<Skeleton className="h-4 w-1/4" />
				<Skeleton className="mt-4 h-4 w-11/12" />
				<Skeleton className="mt-2 h-4 w-4/5" />
				<Skeleton className="mt-2 h-4 w-2/3" />
			</div>
			<PaperSkeleton sections={3} />
		</div>
	);
}

/**
 * An open letter (design.md §5.5-5.6): a received note clipped to its page with the reader's
 * own reasons and the answers; a sent note with its state in words; or, once she says yes, the
 * Introduction. The letter id is the same URL through the whole thread.
 */
export function LetterView({ letterId, backHref }: { letterId: string; backHref?: string }) {
	const t = useTranslations("letters");
	const locale = useLocale();
	const words = useLetterWords();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { slug, candidateFirstName } = useHousehold();
	const [justAccepted, setJustAccepted] = useState(false);
	const [yesOpen, setYesOpen] = useState(false);
	const [declineOpen, setDeclineOpen] = useState(false);
	const [familyOpen, setFamilyOpen] = useState(false);
	const [whyOpen, setWhyOpen] = useState(false);
	const [reportTarget, setReportTarget] = useState<{
		context: "letter" | "message";
		id: string;
	} | null>(null);
	const [blockOpen, setBlockOpen] = useState(false);
	const [takeBackOpen, setTakeBackOpen] = useState(false);
	const [answerError, setAnswerError] = useState<string | null>(null);

	const query = useQuery({
		...orpc.interests.get.queryOptions({ input: { letterId } }),
		// A sealed note waiting for an answer is polled, so the seals can break live.
		refetchInterval: (current) =>
			current.state.data?.direction === "sent" &&
			current.state.data.letter.state === "waiting_for_them"
				? 8000
				: false,
		refetchOnWindowFocus: true,
	});
	const detail = query.data;

	const respond = useMutation(orpc.interests.respond.mutationOptions());
	const withdraw = useMutation(orpc.interests.withdraw.mutationOptions());

	const invalidate = useCallback(() => {
		void queryClient.invalidateQueries({ queryKey: orpc.interests.key() });
		void queryClient.invalidateQueries({ queryKey: orpc.folio.key() });
	}, [queryClient]);

	const contextLine = detail
		? detail.introduction
			? t("introductionContext")
			: words(detail.letter)
		: null;
	useShellContextLine(contextLine);

	const answerErrorText = (error: unknown) => {
		const name = detail ? firstNameOf(detail.otherPage.header.displayName) : "";
		switch (knownErrorCode(error)) {
			case "LETTER_WITHDRAWN":
				return t("errors.withdrawn", { name });
			case "LETTER_CLOSED":
				return t("errors.expired");
			case "PAGE_UNAVAILABLE":
				return t("errors.pageClosed");
			case "LETTER_NOT_PENDING":
				return t("errors.notPending");
			default:
				return t("errors.generic");
		}
	};

	if (!detail) {
		if (query.isError) {
			const missing = errorStatus(query.error) === "NOT_FOUND";
			return (
				<div className="px-4 md:px-8 pt-6 md:pt-12 mx-auto max-w-(--page-width)">
					<PaperSlip
						role="alert"
						title={missing ? t("errors.missing") : t("errors.load")}
						actions={
							missing ? (
								<Link
									href={backHref ?? `/${slug}/letters`}
									className="text-ui text-seal-ink underline-offset-4 hover:underline"
								>
									{t("backToLetters")}
								</Link>
							) : (
								<Button variant="secondary" onClick={() => void query.refetch()}>
									{t("tryAgain")}
								</Button>
							)
						}
					/>
				</div>
			);
		}
		return <LetterSkeleton />;
	}

	const other = detail.otherPage;
	const name = firstNameOf(other.header.displayName);
	const state = detail.letter.state;
	const received = detail.direction === "received";

	const report = () => setReportTarget({ context: "letter", id: detail.letter.letterId });

	if (detail.introduction) {
		return (
			<div className="md:px-6 lg:px-8 pt-3 md:pt-8 pb-10">
				<BackLine href={backHref ?? `/${slug}/letters`} />
				<IntroductionLetter
					introduction={detail.introduction}
					justAccepted={justAccepted}
					onReport={report}
					onReportMessage={(id) => setReportTarget({ context: "message", id })}
					onBlock={() => setBlockOpen(true)}
				/>
				<ReportAndBlock
					detail={detail}
					name={name}
					reportTarget={reportTarget}
					setReportTarget={setReportTarget}
					blockOpen={blockOpen}
					setBlockOpen={setBlockOpen}
					onBlocked={() => {
						invalidate();
						router.push(`/${slug}/letters`);
					}}
				/>
			</div>
		);
	}

	const statusLine = (() => {
		switch (state) {
			case "waiting_for_them":
				return t("status.waitingForThem", { name });
			case "declined_by_them":
				return detail.letter.declineMode === "kind_note"
					? t("status.declinedKindly", { name })
					: t("status.closedQuietly");
			case "withdrawn_by_them":
				return t("status.withdrawnByThem", { name });
			case "withdrawn_by_you":
				return t("status.withdrawnByYou");
			case "declined_by_you":
				return t("status.declinedByYou");
			case "expired":
				return t("status.expired");
			case "closed":
				return t("status.closed");
			default:
				return null;
		}
	})();

	const settled = !detail.canAnswer && !detail.canWithdraw;
	const item = asReaderItem(detail);

	const accept = async () => {
		setAnswerError(null);
		try {
			await respond.mutateAsync({ letterId, action: "accept" });
			setJustAccepted(true);
			setYesOpen(false);
			invalidate();
			await query.refetch();
		} catch (error) {
			setAnswerError(answerErrorText(error));
		}
	};

	const decline = async (mode: "kind_note" | "quiet", note?: string) => {
		setAnswerError(null);
		try {
			await respond.mutateAsync({
				letterId,
				action: "decline",
				declineMode: mode,
				declineNote: mode === "kind_note" ? note : undefined,
			});
			setDeclineOpen(false);
			invalidate();
			await query.refetch();
		} catch (error) {
			setAnswerError(answerErrorText(error));
		}
	};

	const takeBack = async () => {
		try {
			await withdraw.mutateAsync({ letterId });
			invalidate();
			await query.refetch();
		} catch (error) {
			setAnswerError(answerErrorText(error));
		}
	};

	const actions = received && detail.canAnswer && (
		<>
			<Button variant="outline" onClick={() => setDeclineOpen(true)}>
				{t("actions.decline")}
			</Button>
			<Button variant="outline" onClick={() => setFamilyOpen(true)}>
				<ShareIcon className="max-sm:hidden" />
				{t("actions.family")}
			</Button>
			<Button variant="primary" onClick={() => setYesOpen(true)}>
				{t("actions.yes")}
			</Button>
		</>
	);

	return (
		<div className="md:px-6 lg:px-8 pt-3 md:pt-8 max-lg:pb-28 min-[1440px]:gap-10 min-[1440px]:grid min-[1440px]:grid-cols-[minmax(0,var(--page-width))_var(--margin-width)] min-[1440px]:justify-center">
			<div className="min-w-0">
				<BackLine href={backHref ?? `/${slug}/letters`} />

				{received && detail.safetyFlag && (
					<SafetyNote
						category={detail.safetyFlag.category}
						onReport={report}
						onBlock={() => setBlockOpen(true)}
					/>
				)}

				{statusLine && (
					<p
						className={cn(
							"mx-3 md:mx-6 mb-4 font-display text-letter",
							settled ? "text-muted-foreground" : "text-foreground",
						)}
					>
						{statusLine}
					</p>
				)}
				{detail.declineNote &&
					(state === "declined_by_them" || state === "declined_by_you") && (
						<p className="mx-3 md:mx-6 mb-5 font-display text-letter whitespace-pre-line">
							“{detail.declineNote}”
						</p>
					)}

				{detail.note && (
					<NoteSlip
						note={detail.note}
						salutationName={received ? candidateFirstName : name}
						signerName={detail.signer.firstName}
						signerInitials={sealInitials(detail.signer.displayName)}
						verification={detail.signer.verification}
						sealedAt={detail.letter.createdAt}
						priority={detail.letter.isPriority}
						dimmed={settled}
						footer={
							!received ? (
								<p className="mt-3 text-meta text-muted-foreground tabular">
									{t("sealedOn", {
										date: formatDateTime(detail.letter.createdAt, locale),
									})}
								</p>
							) : undefined
						}
					/>
				)}

				<BiodataPage page={other} className="max-md:border-x-0" />

				{answerError && (
					<p role="alert" className="mx-3 md:mx-0 mt-4 text-body text-destructive">
						{answerError}
					</p>
				)}

				{detail.canWithdraw && (
					<div className="mx-3 md:mx-0 mt-6">
						<Button
							variant="ghost"
							onClick={() => setTakeBackOpen(true)}
							loading={withdraw.isPending}
						>
							{t("actions.takeBack")}
						</Button>
					</div>
				)}

				{received && detail.canAnswer && (
					<div
						data-print-hide
						className="lg:flex bottom-0 mt-6 gap-2 py-3 sticky z-20 hidden border-t border-border bg-background min-[1440px]:hidden"
					>
						<button
							type="button"
							onClick={() => setWhyOpen(true)}
							className="min-w-0 mr-auto truncate text-left text-meta text-muted-foreground underline-offset-4 hover:underline"
						>
							{t("whyForYou")}
						</button>
						{actions}
					</div>
				)}

				<div className="mx-3 md:mx-0 mt-8 gap-6 flex flex-wrap">
					<button
						type="button"
						onClick={report}
						className="min-h-11 text-ui text-muted-foreground underline-offset-4 hover:underline"
					>
						{t("actions.report")}
					</button>
					<button
						type="button"
						onClick={() => setBlockOpen(true)}
						className="min-h-11 text-ui text-muted-foreground underline-offset-4 hover:underline"
					>
						{t("actions.block", { name })}
					</button>
				</div>
			</div>

			<aside className="hidden min-[1440px]:block" aria-label={t("marginLabel")}>
				<div className="gap-8 sticky top-[calc(var(--masthead-height)+2rem)] flex flex-col">
					<section>
						<h2 className="label-caps text-muted-foreground">{t("whyTitle")}</h2>
						<WhyReasons reasons={detail.reasons} name={name} dense className="mt-3" />
					</section>
					<section>
						<h2 className="label-caps text-muted-foreground">{t("pencilTitle")}</h2>
						<PencilNotesList
							notes={detail.pencilNotes}
							onChanged={() => void query.refetch()}
							className="mt-2"
						/>
					</section>
					{received && detail.canAnswer && (
						<div className="gap-2 flex flex-col">{actions}</div>
					)}
				</div>
			</aside>

			{received && detail.canAnswer && (
				<BottomSlot>
					<PhoneLetterBar
						reasons={detail}
						name={name}
						onWhy={() => setWhyOpen(true)}
						actions={actions}
					/>
				</BottomSlot>
			)}

			<SayYesSheet
				open={yesOpen}
				onOpenChange={setYesOpen}
				name={name}
				onConfirm={() => void accept()}
				pending={respond.isPending}
				error={answerError}
			/>
			<DeclineSheet
				open={declineOpen}
				onOpenChange={setDeclineOpen}
				name={name}
				onKindNote={(note) => void decline("kind_note", note)}
				onQuiet={() => void decline("quiet")}
				pending={respond.isPending}
				error={answerError}
			/>
			<FamilyLinkDialog
				open={familyOpen}
				onOpenChange={setFamilyOpen}
				handle={other.handle}
				pageName={name}
				letterId={received ? detail.letter.letterId : undefined}
			/>
			<WhyThisPageSheet
				open={whyOpen}
				onOpenChange={setWhyOpen}
				item={item}
				name={name}
				onNotesChanged={() => void query.refetch()}
				onFamily={() => {
					setWhyOpen(false);
					setFamilyOpen(true);
				}}
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
						<AlertDialogAction onClick={() => void takeBack()}>
							{t("takeBack.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<ReportAndBlock
				detail={detail}
				name={name}
				reportTarget={reportTarget}
				setReportTarget={setReportTarget}
				blockOpen={blockOpen}
				setBlockOpen={setBlockOpen}
				onBlocked={() => {
					invalidate();
					router.push(`/${slug}/letters`);
				}}
			/>
		</div>
	);
}

function BackLine({ href }: { href: string }) {
	const t = useTranslations("letters");
	return (
		<div data-print-hide className="lg:hidden mb-3 px-3 md:px-0">
			<Link
				href={href}
				className="min-h-11 inline-flex items-center text-ui text-muted-foreground hover:text-foreground"
			>
				← {t("title")}
			</Link>
		</div>
	);
}

function PhoneLetterBar({
	reasons,
	name,
	onWhy,
	actions,
}: {
	reasons: LetterDetail;
	name: string;
	onWhy: () => void;
	actions: React.ReactNode;
}) {
	const t = useTranslations("letters");
	const first = useFirstReason(reasons.reasons, name);
	return (
		<div className="lg:hidden bg-background">
			<button
				type="button"
				onClick={onWhy}
				className="px-4 gap-3 h-11 flex w-full items-center border-t border-border bg-card text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
			>
				<span className="min-w-0 flex-1 truncate text-meta">
					{first ? t("whyForYouHandle", { reason: first }) : t("whyForYou")}
				</span>
				<ChevronUpIcon
					className="size-4 shrink-0 text-muted-foreground"
					aria-hidden="true"
				/>
			</button>
			<div className="px-2 gap-2 [&>*]:px-1 [&>*]:py-1.5 [&>*]:leading-tight grid grid-cols-[1fr_1fr_1.2fr] border-t border-border [&>*]:h-auto [&>*]:min-h-(--bar-height) [&>*]:text-center [&>*]:text-ui [&>*]:text-balance [&>*]:whitespace-normal">
				{actions}
			</div>
		</div>
	);
}

function ReportAndBlock({
	detail,
	name,
	reportTarget,
	setReportTarget,
	blockOpen,
	setBlockOpen,
	onBlocked,
}: {
	detail: LetterDetail;
	name: string;
	reportTarget: { context: "letter" | "message"; id: string } | null;
	setReportTarget: (target: { context: "letter" | "message"; id: string } | null) => void;
	blockOpen: boolean;
	setBlockOpen: (open: boolean) => void;
	onBlocked: () => void;
}) {
	return (
		<>
			<ReportDialog
				open={reportTarget !== null}
				onOpenChange={(open) => {
					if (!open) {
						setReportTarget(null);
					}
				}}
				context={reportTarget?.context ?? "letter"}
				contextId={reportTarget?.id ?? detail.letter.letterId}
				name={name}
				onBlocked={onBlocked}
			/>
			<BlockDialog
				open={blockOpen}
				onOpenChange={setBlockOpen}
				handle={detail.otherPage.handle}
				name={name}
				onBlocked={onBlocked}
			/>
		</>
	);
}
