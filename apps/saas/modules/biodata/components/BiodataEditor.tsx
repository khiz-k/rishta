"use client";

import { type HouseholdAbilities, useHousehold } from "@household/components/HouseholdProvider";
import type { VisibleField } from "@repo/database/drizzle/domain";
import { Button, cn, InvocationGlyph, MonogramSeal, VerifiedMark } from "@repo/ui";
import { PaperSkeleton } from "@shared/components/PaperSkeleton";
import { PaperSlip } from "@shared/components/PaperSlip";
import { ResponsiveSheet } from "@shared/components/ResponsiveSheet";
import { BottomSlot, useShellContextLine } from "@shared/components/shell/ShellContext";
import { useErrorText } from "@shared/hooks/use-error-text";
import type { MyPage } from "@shared/lib/api-types";
import { formatFeetInches } from "@shared/lib/format";
import { orpc } from "@shared/lib/orpc-query-utils";
import { onRovingKeyDown, rovingTabIndex } from "@shared/lib/roving";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, PrinterIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
	ABOUT_FIELD,
	EDITOR_SECTIONS,
	type FieldDef,
	HEADER_FIELDS,
	LOOKING_FOR_FIELD,
	SEALED_FIELDS,
} from "../lib/editor-fields";
import { usePageText } from "../lib/fields";
import { type PreviewAs, previewView } from "../lib/preview";
import { usePagePatch } from "../lib/use-page-patch";
import { BiodataPage } from "./BiodataPage";
import { EditableField } from "./EditableField";
import { DraftInPencil, type DraftSection, type Drafts, HelpMeWrite } from "./HelpMeWrite";
import { PageImageSheet } from "./PageImageSheet";
import { PageSection } from "./PagePrimitives";
import { PhotoManager } from "./PhotoManager";

const SEE_AS: readonly PreviewAs[] = ["self", "stranger", "introduced", "family_link"];

const COMPLETENESS_ORDER = [
	"personal",
	"education",
	"family",
	"lifestyle",
	"about",
	"looking_for",
] as const;

function header(defs: FieldDef[], key: string) {
	const found = defs.find((def) => def.key === key);
	if (!found) {
		throw new Error(`Unknown field ${key}`);
	}
	return found;
}

/**
 * My Biodata (design.md §5.7): the page edited in place. What you see is exactly what others
 * see, what prints and what exports; each value edits where it sits, with its own Shown · Sealed
 * · Matching only. The margins hold completeness in words, Help me write, preview-as, export and
 * the publish line.
 */
export function BiodataEditor() {
	const t = useTranslations("biodata");
	const { organizationId, abilities, candidateFirstName } = useHousehold();
	const query = useQuery(orpc.profiles.me.queryOptions({ input: { organizationId } }));
	const [previewAs, setPreviewAs] = useState<PreviewAs>("self");
	const [drafts, setDrafts] = useState<Drafts | null>(null);
	const [marginOpen, setMarginOpen] = useState(false);
	const [photosOpen, setPhotosOpen] = useState(false);
	const [imageOpen, setImageOpen] = useState(false);

	useShellContextLine(t("title"));

	/**
	 * What leaves the app follows "See it as": while editing, an export is the page as a
	 * stranger reads it, so nothing sealed goes out unless you choose "After you both say yes".
	 */
	const exportAs: Exclude<PreviewAs, "self" | "family_link"> =
		previewAs === "introduced" ? "introduced" : "stranger";
	const exportView = useMemo(
		() => (query.data ? previewView(query.data, exportAs) : null),
		[query.data, exportAs],
	);

	if (!query.data) {
		if (query.isError) {
			return (
				<div className="px-4 md:px-6 pt-6 md:pt-14 mx-auto max-w-(--page-width)">
					<PaperSlip
						role="alert"
						title={t("error")}
						actions={
							<Button variant="secondary" onClick={() => void query.refetch()}>
								{t("tryAgain")}
							</Button>
						}
					/>
				</div>
			);
		}
		return (
			<div className="md:px-6 pt-3 md:pt-10">
				<PaperSkeleton />
			</div>
		);
	}

	const myPage = query.data;
	const canEdit = myPage.canEdit;
	const printView = exportView ?? myPage.view;

	const seeAs = (
		<section aria-labelledby="see-as">
			<h2 id="see-as" className="label-caps text-muted-foreground">
				{t("seeAs.title")}
			</h2>
			<div
				role="radiogroup"
				aria-labelledby="see-as"
				// Arrows change the preview but leave the phone's margin sheet open; a tap closes it.
				onKeyDown={(event) =>
					onRovingKeyDown(event, (item) => {
						const as = SEE_AS.find((value) => value === item.dataset.value);
						if (as) {
							setPreviewAs(as);
						}
					})
				}
				className="mt-2 flex flex-col"
			>
				{SEE_AS.map((as, index) => (
					<button
						key={as}
						type="button"
						role="radio"
						data-value={as}
						aria-checked={previewAs === as}
						tabIndex={rovingTabIndex(previewAs === as, index, true)}
						onClick={() => {
							setPreviewAs(as);
							setMarginOpen(false);
						}}
						className={cn(
							"gap-2.5 min-h-11 flex items-center text-left text-ui",
							previewAs === as
								? "text-foreground"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<span
							aria-hidden="true"
							className="size-4 inline-flex shrink-0 items-center justify-center border border-input text-[0.7rem]"
						>
							{previewAs === as ? "■" : ""}
						</span>
						{t(`seeAs.${as}`)}
					</button>
				))}
			</div>
		</section>
	);

	const exportBlock = (
		<section aria-labelledby="export">
			<h2 id="export" className="label-caps text-muted-foreground">
				{t("export.title")}
			</h2>
			<div className="mt-1 flex flex-col items-start">
				<Button
					variant="ghost"
					size="sm"
					className="px-0"
					onClick={() => {
						setMarginOpen(false);
						window.setTimeout(() => window.print(), 50);
					}}
				>
					<PrinterIcon className="size-4" />
					{t("export.print")}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="px-0"
					onClick={() => {
						setMarginOpen(false);
						setImageOpen(true);
					}}
				>
					<ImageIcon className="size-4" />
					{t("export.image")}
				</Button>
			</div>
			<p className="mt-1 text-meta text-muted-foreground">
				{t(`export.as.${exportAs}`)} {t("export.printNote")}
			</p>
		</section>
	);

	const readers =
		abilities.isCandidate && myPage.readersThisWeek !== null ? (
			<ReadersLink count={myPage.readersThisWeek} />
		) : null;

	const rightMargin = (
		<>
			<Completeness myPage={myPage} />
			{canEdit && (
				<section aria-labelledby="help-me-write">
					<h2 id="help-me-write" className="sr-only">
						{t("help.title")}
					</h2>
					<HelpMeWrite
						onDrafts={(next) => {
							setDrafts(next);
							setPreviewAs("self");
							setMarginOpen(false);
						}}
					/>
					{drafts && drafts.omittedPhrases.length > 0 && (
						<p className="mt-3 pencil text-meta">{t("help.omitted")}</p>
					)}
				</section>
			)}
			<PublishBlock myPage={myPage} />
		</>
	);

	const preview = previewAs !== "self";

	return (
		<div
			className={cn(
				"md:px-6 lg:px-10 pt-3 md:pt-8 lg:grid lg:grid-cols-[minmax(0,var(--page-width))_280px] lg:justify-center lg:gap-10 xl:grid-cols-[220px_minmax(0,var(--page-width))_280px] mx-auto max-w-[1440px]",
				// The phone's publish bar sits over the page's last lines otherwise.
				statusActionFor(myPage, abilities) && "max-md:pb-(--bar-height)",
			)}
		>
			<aside data-print-hide className="xl:block hidden" aria-label={t("marginLeft")}>
				<div className="gap-8 sticky top-[calc(var(--masthead-height)+2rem)] flex flex-col">
					{seeAs}
					{exportBlock}
					{readers}
				</div>
			</aside>

			<div className="min-w-0">
				<StatusLine myPage={myPage} />

				<div
					data-print-hide
					className="lg:hidden mb-3 px-3 md:px-0 flex items-center justify-between"
				>
					<p className="text-meta text-muted-foreground">
						{preview
							? t(`seeAs.showing.${previewAs}`)
							: canEdit
								? t("tapToEdit")
								: t("readOnly", { name: candidateFirstName })}
					</p>
					<Button variant="outline" size="sm" onClick={() => setMarginOpen(true)}>
						{t("marginButton")}
					</Button>
				</div>

				{/* The printed page is always the finished document, never the editor. */}
				<div className="hidden print:block">
					<BiodataPage page={printView} />
				</div>

				<div className="print:hidden">
					{preview ? (
						<>
							<p
								data-print-hide
								className="lg:block mb-3 hidden text-meta text-muted-foreground"
							>
								{t(`seeAs.showing.${previewAs}`)}{" "}
								<button
									type="button"
									onClick={() => setPreviewAs("self")}
									className="text-seal-ink underline-offset-4 hover:underline"
								>
									{t("seeAs.backToEditing")}
								</button>
							</p>
							<BiodataPage
								page={previewView(myPage, previewAs)}
								scale={previewAs === "family_link" ? "family" : "normal"}
								className="max-md:border-x-0"
							/>
						</>
					) : (
						<EditablePage
							myPage={myPage}
							canEdit={canEdit}
							canSetVisibility={abilities.canManage}
							drafts={drafts}
							onDraftUsed={(section) =>
								setDrafts((current) =>
									current ? { ...current, [section]: undefined } : current,
								)
							}
							onPhotos={() => setPhotosOpen(true)}
						/>
					)}
				</div>
			</div>

			<aside data-print-hide className="lg:block hidden" aria-label={t("marginRight")}>
				{/* -mx-1 px-1: room for the 2px focus ring, which the scroll box would otherwise clip. */}
				<div className="-mx-1 px-1 gap-8 pb-8 sticky top-[calc(var(--masthead-height)+2rem)] flex max-h-[calc(100dvh-var(--masthead-height)-3rem)] flex-col overflow-y-auto">
					{rightMargin}
					<div className="xl:hidden gap-8 flex flex-col">
						{seeAs}
						{exportBlock}
						{readers}
					</div>
				</div>
			</aside>

			<ResponsiveSheet
				open={marginOpen}
				onOpenChange={setMarginOpen}
				title={t("marginButton")}
			>
				<div className="gap-8 flex flex-col">
					{seeAs}
					{rightMargin}
					{exportBlock}
					{readers}
				</div>
			</ResponsiveSheet>

			<PhotoManager open={photosOpen} onOpenChange={setPhotosOpen} photos={myPage.photos} />
			<PageImageSheet
				open={imageOpen}
				onOpenChange={setImageOpen}
				page={printView}
				audienceNote={t(`export.as.${exportAs}`)}
			/>
		</div>
	);
}

function ReadersLink({ count }: { count: number }) {
	const t = useTranslations("biodata.readers");
	const { slug } = useHousehold();
	return (
		<section aria-labelledby="readers-link">
			<h2 id="readers-link" className="label-caps text-muted-foreground">
				{t("title")}
			</h2>
			<Link
				href={`/${slug}/biodata/readers`}
				className="mt-1 min-h-11 inline-flex items-center text-ui text-seal-ink tabular underline-offset-4 hover:underline"
			>
				{t("thisWeek", { count })} →
			</Link>
		</section>
	);
}

/** "Family · 2 of 5": completeness in words per section, never a percentage bar. */
function Completeness({ myPage }: { myPage: MyPage }) {
	const t = useTranslations("biodata.completeness");
	const tSections = useTranslations("page.sections");
	return (
		<section aria-labelledby="completeness">
			<h2 id="completeness" className="label-caps text-muted-foreground">
				{t("title")}
			</h2>
			<ul className="mt-2 gap-1 flex flex-col">
				{COMPLETENESS_ORDER.map((id) => {
					const entry = myPage.completeness[id];
					if (!entry) {
						return null;
					}
					const done = entry.filled >= entry.total;
					return (
						<li key={id} className="flex justify-between text-ui tabular">
							<span>{tSections(id)}</span>
							<span className={done ? "text-foreground" : "text-muted-foreground"}>
								{id === "about"
									? done
										? t("written")
										: t("notYet")
									: done
										? t("complete")
										: t("count", { filled: entry.filled, total: entry.total })}
							</span>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

function usePublishActions() {
	const { organizationId } = useHousehold();
	const queryClient = useQueryClient();
	const refresh = () => {
		void queryClient.invalidateQueries({ queryKey: orpc.profiles.me.key() });
		void queryClient.invalidateQueries({ queryKey: orpc.households.get.key() });
		void queryClient.invalidateQueries({ queryKey: orpc.folio.key() });
	};
	const publish = useMutation({ ...orpc.profiles.publish.mutationOptions(), onSuccess: refresh });
	const pause = useMutation({ ...orpc.profiles.pause.mutationOptions(), onSuccess: refresh });
	const resume = useMutation({ ...orpc.profiles.resume.mutationOptions(), onSuccess: refresh });
	return { publish, pause, resume, organizationId };
}

type StatusAction = "publish" | "resume" | "invite";

/** The page's primary action while it is not live, if the signed-in person may take it. */
function statusActionFor(
	myPage: MyPage,
	abilities: Pick<HouseholdAbilities, "isCandidate" | "canShare">,
): StatusAction | null {
	switch (myPage.page.status) {
		case "awaiting_claim":
			return abilities.canShare ? "invite" : null;
		case "draft":
			return abilities.isCandidate ? "publish" : null;
		case "paused":
			return abilities.isCandidate ? "resume" : null;
		default:
			return null;
	}
}

/**
 * The sticky line above a draft or paused page (design.md §5.7). On the phone its action (Publish,
 * Resume, Invite) moves into the bottom stack, in the thumb zone above the BottomBar, and the line
 * keeps the words.
 */
function StatusLine({ myPage }: { myPage: MyPage }) {
	const t = useTranslations("biodata.status");
	const tMissing = useTranslations("biodata.missing");
	const errorText = useErrorText();
	const { abilities, candidateFirstName, slug } = useHousehold();
	const { publish, resume, organizationId } = usePublishActions();
	const status = myPage.page.status;

	if (status === "active") {
		return null;
	}

	const missing = myPage.missingForPublish.map((key) =>
		tMissing.has(key as Parameters<typeof tMissing>[0])
			? tMissing(key as Parameters<typeof tMissing>[0])
			: key,
	);

	let body: React.ReactNode = null;
	let action: React.ReactNode = null;
	if (status === "awaiting_claim") {
		body = t("awaitingClaim", { name: candidateFirstName });
		action = abilities.canShare ? (
			<Link
				href={`/${slug}/settings/members`}
				className="text-ui text-seal-ink underline-offset-4 hover:underline"
			>
				{t("inviteCandidate", { name: candidateFirstName })}
			</Link>
		) : null;
	} else if (status === "draft") {
		if (abilities.isCandidate) {
			body =
				missing.length > 0
					? t("draftMissing", { missing: missing.join(", ") })
					: t("draftReady");
			action = (
				<Button
					variant="primary"
					size="sm"
					disabled={myPage.missingForPublish.length > 0}
					loading={publish.isPending}
					onClick={() => publish.mutate({ organizationId })}
				>
					{t("publish")}
				</Button>
			);
		} else {
			body = t("draftForFamily", { name: candidateFirstName });
		}
	} else if (status === "paused") {
		body = t("paused");
		action = abilities.isCandidate ? (
			<Button
				variant="secondary"
				size="sm"
				loading={resume.isPending}
				onClick={() => resume.mutate({ organizationId })}
			>
				{t("resume")}
			</Button>
		) : null;
	} else if (status === "closed") {
		body = t("closed");
	}

	const kind = statusActionFor(myPage, abilities);
	const phoneAction =
		kind === "publish" ? (
			<Button
				variant="primary"
				className="w-full"
				disabled={myPage.missingForPublish.length > 0}
				loading={publish.isPending}
				onClick={() => publish.mutate({ organizationId })}
			>
				{t("publish")}
			</Button>
		) : kind === "resume" ? (
			<Button
				variant="secondary"
				className="w-full"
				loading={resume.isPending}
				onClick={() => resume.mutate({ organizationId })}
			>
				{t("resume")}
			</Button>
		) : kind === "invite" ? (
			<Button variant="outline" className="w-full" asChild>
				<Link href={`/${slug}/settings/members`}>
					{t("inviteCandidate", { name: candidateFirstName })}
				</Link>
			</Button>
		) : null;

	return (
		<>
			<div
				data-print-hide
				role="status"
				className="md:top-(--masthead-height) mb-4 gap-x-4 gap-y-2 px-4 py-3 md:px-5 max-md:border-x-0 sticky top-[calc(var(--topline-height))] z-30 flex flex-wrap items-center border border-border bg-sealed"
			>
				<p className="min-w-0 flex-1 text-body">{body}</p>
				{action && <div className="max-md:hidden">{action}</div>}
				{(publish.error || resume.error) && (
					<p role="alert" className="w-full text-meta text-destructive">
						{errorText(publish.error ?? resume.error)}
					</p>
				)}
			</div>
			{phoneAction && (
				<BottomSlot>
					<div
						data-print-hide
						className="md:hidden px-3 py-1.5 flex min-h-(--bar-height) items-center border-t border-border bg-background"
					>
						{phoneAction}
					</div>
				</BottomSlot>
			)}
		</>
	);
}

/** Publish, then "Your page is live." with Pause; or the paused line with Resume. */
function PublishBlock({ myPage }: { myPage: MyPage }) {
	const t = useTranslations("biodata.status");
	const errorText = useErrorText();
	const { abilities, candidateFirstName } = useHousehold();
	const { publish, pause, resume, organizationId } = usePublishActions();
	const status = myPage.page.status;

	return (
		<section aria-labelledby="publish" className="gap-2 flex flex-col">
			<h2 id="publish" className="label-caps text-muted-foreground">
				{t("title")}
			</h2>
			{status === "active" && (
				<>
					<p className="font-display text-letter">{t("live")}</p>
					{abilities.isCandidate && (
						<Button
							variant="ghost"
							size="sm"
							className="px-0 justify-start"
							loading={pause.isPending}
							onClick={() => pause.mutate({ organizationId })}
						>
							{t("pause")}
						</Button>
					)}
				</>
			)}
			{status === "paused" && (
				<>
					<p className="text-body">{t("paused")}</p>
					{abilities.isCandidate && (
						<Button
							variant="secondary"
							size="sm"
							loading={resume.isPending}
							onClick={() => resume.mutate({ organizationId })}
						>
							{t("resume")}
						</Button>
					)}
				</>
			)}
			{status === "draft" &&
				(abilities.isCandidate ? (
					<>
						<p className="text-body">{t("private")}</p>
						<Button
							variant="primary"
							size="sm"
							disabled={myPage.missingForPublish.length > 0}
							loading={publish.isPending}
							onClick={() => publish.mutate({ organizationId })}
						>
							{t("publish")}
						</Button>
					</>
				) : (
					<p className="text-body">{t("draftForFamily", { name: candidateFirstName })}</p>
				))}
			{status === "awaiting_claim" && (
				<p className="text-body">{t("awaitingClaim", { name: candidateFirstName })}</p>
			)}
			{status === "closed" && <p className="text-body">{t("closed")}</p>}
			{(publish.error || pause.error || resume.error) && (
				<p role="alert" className="text-meta text-destructive">
					{errorText(publish.error ?? pause.error ?? resume.error)}
				</p>
			)}
		</section>
	);
}

function EditablePage({
	myPage,
	canEdit,
	canSetVisibility,
	drafts,
	onDraftUsed,
	onPhotos,
}: {
	myPage: MyPage;
	canEdit: boolean;
	canSetVisibility: boolean;
	drafts: Drafts | null;
	onDraftUsed: (section: DraftSection) => void;
	onPhotos: () => void;
}) {
	const t = useTranslations("biodata");
	const tSections = useTranslations("page.sections");
	const pageText = usePageText();
	const { candidateInitials } = useHousehold();
	const { save } = usePagePatch();
	const [usingDraft, setUsingDraft] = useState<DraftSection | null>(null);
	const page = myPage.page;
	const view = myPage.view;
	const firstPhoto = [...myPage.photos].sort((a, b) => a.position - b.position)[0];
	const meta = [
		view.header.age !== null ? String(view.header.age) : null,
		page.height ? formatFeetInches(page.height) : null,
		page.location,
	]
		.filter(Boolean)
		.join(" · ");

	const fieldProps = { page, canEdit, canSetVisibility };

	const applyDraft = async (section: DraftSection, def: FieldDef) => {
		const text = drafts?.[section];
		if (!text) {
			return;
		}
		setUsingDraft(section);
		try {
			await save(def, text);
			onDraftUsed(section);
		} finally {
			setUsingDraft(null);
		}
	};

	const draftFor = (section: DraftSection, def: FieldDef) =>
		drafts?.[section] ? (
			<DraftInPencil
				text={drafts[section] ?? ""}
				using={usingDraft === section}
				onUse={() => void applyDraft(section, def)}
				onDiscard={() => onDraftUsed(section)}
			/>
		) : null;

	const invocationDef = header(HEADER_FIELDS, "invocation");
	const invocationTextDef = header(HEADER_FIELDS, "invocationText");

	return (
		<article
			lang={page.pageLanguage}
			dir={page.pageLanguage === "ur" ? "rtl" : "ltr"}
			aria-label={t("editingLabel")}
			data-print-page
			className="max-md:border-x-0 mx-auto w-full max-w-(--page-width) border border-border bg-card"
		>
			<div aria-hidden="true" className="double-rule" />
			<div className="pt-4 pb-8 page-pad">
				<div className="mt-3 flex flex-col items-center text-center">
					{page.invocation !== "none" && (
						<InvocationGlyph
							kind={page.invocation}
							text={page.invocationText ?? undefined}
						/>
					)}
					{canEdit && (
						<div
							data-print-hide
							className="mt-1 gap-3 flex flex-wrap justify-center text-meta"
						>
							<EditableField
								def={invocationDef}
								{...fieldProps}
								layout="inline"
								labelOverride={t("invocationLabel")}
							/>
							{page.invocation === "custom" && (
								<EditableField
									def={invocationTextDef}
									{...fieldProps}
									layout="inline"
								/>
							)}
						</div>
					)}
				</div>

				<header className="mt-5 gap-4 md:gap-6 grid grid-cols-[1fr_30%]">
					<div className="min-w-0">
						{canEdit ? (
							<>
								<h1 className="sr-only">{page.displayName}</h1>
								<div className="font-display text-name-sm break-words min-[400px]:text-title">
									<EditableField
										def={header(HEADER_FIELDS, "displayName")}
										{...fieldProps}
										layout="inline"
									/>
								</div>
							</>
						) : (
							<h1 className="font-display text-name-sm break-words min-[400px]:text-title">
								{page.displayName}
							</h1>
						)}
						{meta && <p className="mt-1 text-body tabular">{meta}</p>}
						<p className="mt-1 text-meta text-muted-foreground">
							{canEdit ? (
								<>
									<span>{t("writtenByLabel")} </span>
									<EditableField
										def={header(HEADER_FIELDS, "createdBy")}
										{...fieldProps}
										layout="inline"
									/>
								</>
							) : (
								pageText.signer(view.header)
							)}
						</p>
						{canEdit && (
							<p className="mt-1 text-meta text-muted-foreground">
								<span>{t("languageLabel")} </span>
								<EditableField
									def={header(HEADER_FIELDS, "pageLanguage")}
									{...fieldProps}
									layout="inline"
								/>
							</p>
						)}
						{pageText.verification(view.header.verification) && (
							<div className="mt-1.5">
								<VerifiedMark className="text-muted-foreground">
									{pageText.verification(view.header.verification)}
								</VerifiedMark>
							</div>
						)}
					</div>
					<button
						type="button"
						onClick={canEdit ? onPhotos : undefined}
						disabled={!canEdit}
						className="group relative aspect-[4/5] w-full overflow-hidden border border-border bg-veil text-center focus-visible:outline-2 focus-visible:outline-ring"
						aria-label={canEdit ? t("photos.manage") : t("photos.title")}
					>
						{firstPhoto?.url ? (
							<img src={firstPhoto.url} alt="" className="size-full object-cover" />
						) : (
							<span className="p-2 inset-0 absolute flex items-center justify-center pencil text-meta">
								{canEdit ? t("photos.addPrompt") : t("photos.none")}
							</span>
						)}
						{canEdit && firstPhoto && (
							<span
								data-print-hide
								className="inset-x-0 bottom-0 py-1 absolute bg-card/90 label-caps text-foreground"
							>
								{t("photos.countLabel", { count: myPage.photos.length })}
							</span>
						)}
					</button>
				</header>

				{EDITOR_SECTIONS.map((section) => {
					const completeness = myPage.completeness[section.id];
					return (
						<PageSection
							key={section.id}
							id={`edit-${section.id}`}
							title={tSections(section.id)}
							aside={
								completeness && completeness.filled < completeness.total ? (
									<p data-print-hide className="lg:hidden mt-1 pencil text-meta">
										{t("completeness.count", {
											filled: completeness.filled,
											total: completeness.total,
										})}
									</p>
								) : undefined
							}
						>
							<dl>
								{section.fields
									.filter((def) => def.key !== "aboutFamily")
									.map((def) => (
										<EditableField key={def.key} def={def} {...fieldProps} />
									))}
							</dl>
							{section.id === "family" && (
								<>
									<p className="mt-4 label-caps text-muted-foreground">
										{pageText.label("aboutFamily")}
									</p>
									<EditableField
										def={
											section.fields.find(
												(def) => def.key === "aboutFamily",
											) ?? ABOUT_FIELD
										}
										{...fieldProps}
										layout="block"
									/>
									{draftFor(
										"aboutFamily",
										section.fields.find((def) => def.key === "aboutFamily") ??
											ABOUT_FIELD,
									)}
								</>
							)}
						</PageSection>
					);
				})}

				<PageSection id="edit-about" title={tSections("about")}>
					<EditableField def={ABOUT_FIELD} {...fieldProps} layout="block" />
					{draftFor("aboutMe", ABOUT_FIELD)}
				</PageSection>

				<PageSection id="edit-looking-for" title={tSections("looking_for")}>
					<EditableField def={LOOKING_FOR_FIELD} {...fieldProps} layout="block" />
					{draftFor("lookingFor", LOOKING_FOR_FIELD)}
					<LookingForLink />
				</PageSection>

				<section aria-labelledby="edit-sealed" className="mt-8">
					<h2 id="edit-sealed" className="hairline-after font-display text-section">
						{tSections("sealed")}
					</h2>
					<div className="mt-3 p-4 md:p-5 border border-dashed border-border bg-sealed">
						<div className="gap-3 mb-2 flex items-center">
							<MonogramSeal initials={candidateInitials} state="pending" size={40} />
							<p className="text-meta text-muted-foreground">{t("sealedNote")}</p>
						</div>
						<dl>
							{SEALED_FIELDS.map((def) => (
								<EditableField key={def.key} def={def} {...fieldProps} />
							))}
						</dl>
						<SealedElsewhere page={page} />
					</div>
				</section>

				<p className="mt-6 text-ref text-muted-foreground tabular">{pageText.ref(view)}</p>
			</div>
		</article>
	);
}

/** Other fields the candidate chose to seal, listed so nothing sealed is a surprise. */
function SealedElsewhere({ page }: { page: MyPage["page"] }) {
	const t = useTranslations("biodata");
	const pageText = usePageText();
	const sealedKeys = Object.entries(page.fieldVisibility)
		.filter(([, visibility]) => visibility === "sealed")
		.map(([key]) => key as VisibleField)
		.filter((key) => !["fullName", "contactPhone", "birthTime", "birthPlace"].includes(key));
	const defaults: VisibleField[] = ["dateOfBirth", "employer", "incomeRange"];
	const keys = Array.from(new Set([...defaults, ...sealedKeys])).filter(
		(key) =>
			(page.fieldVisibility[key] ?? (defaults.includes(key) ? "sealed" : "page")) ===
			"sealed",
	);
	if (keys.length === 0) {
		return null;
	}
	return (
		<p className="mt-3 text-meta text-muted-foreground">
			{t("sealedAlso", { fields: keys.map((key) => pageText.label(key)).join(", ") })}
		</p>
	);
}

function LookingForLink() {
	const t = useTranslations("biodata");
	const { slug } = useHousehold();
	return (
		<Link
			data-print-hide
			href={`/${slug}/biodata/looking-for`}
			className="mt-3 min-h-11 inline-flex items-center text-ui text-seal-ink underline-offset-4 hover:underline"
		>
			{t("nonNegotiables")} →
		</Link>
	);
}
