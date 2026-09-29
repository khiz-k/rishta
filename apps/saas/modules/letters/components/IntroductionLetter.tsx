"use client";

import { usePageText } from "@biodata/lib/fields";
import { useHousehold } from "@household/components/HouseholdProvider";
import { Button, cn, MonogramSeal, sealInitials } from "@repo/ui";
import { useReducedMotion } from "@shared/hooks/use-reduced-motion";
import type { IntroductionView } from "@shared/lib/api-types";
import { knownErrorCode } from "@shared/lib/errors";
import { cityOf, formatLongDate, zonePlace } from "@shared/lib/format";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { CloseKindlySheet } from "./CloseKindlySheet";
import { Correspondence } from "./Correspondence";
import { ProposeThreeTimes } from "./ProposeThreeTimes";

type Phase = "sealed" | "breaking" | "open";

/**
 * A clear photo inside the Introduction. It is fetched when the seals start to break (never
 * before she says yes) and loads under the sealed veil; the 400ms unblur plays once the image
 * has actually arrived, so a slow connection never shows it popping in.
 */
function UnveilingPhoto({ src, alt, unveil }: { src: string; alt: string; unveil: boolean }) {
	const ref = useRef<HTMLImageElement>(null);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		if (ref.current?.complete && ref.current.naturalWidth > 0) {
			setLoaded(true);
		}
	}, []);

	return (
		<img
			ref={ref}
			src={src}
			alt={alt}
			onLoad={() => setLoaded(true)}
			className={cn(
				"size-full object-cover",
				!loaded && "opacity-0",
				loaded && unveil && "animate-unveil",
			)}
			draggable={false}
		/>
	);
}

function zoneAbbreviation(timeZone: string, locale: string) {
	try {
		const parts = new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale, {
			timeZone,
			timeZoneName: "shortGeneric",
		}).formatToParts(new Date());
		return parts.find((part) => part.type === "timeZoneName")?.value ?? zonePlace(timeZone);
	} catch {
		return zonePlace(timeZone);
	}
}

/**
 * The Introduction (design.md §5.6, §6.4). When she says yes, both seals, hers and his, break
 * together: 320ms, each disc splitting along a drawn crack into halves that rotate ∓8° and part
 * 6px. Then both sealed sections open: photos unblur in 400ms (the clear image is only fetched
 * now) and the sealed veil lifts. On his side it plays live, or once on first open. After that
 * the seals are simply shown broken. No confetti, no sound, no celebration.
 */
export function IntroductionLetter({
	introduction,
	justAccepted,
	onReport,
	onReportMessage,
	onBlock,
}: {
	introduction: IntroductionView;
	justAccepted: boolean;
	onReport: () => void;
	onReportMessage: (messageId: string) => void;
	onBlock: () => void;
}) {
	const t = useTranslations("intro");
	const locale = useLocale();
	const text = usePageText();
	const reducedMotion = useReducedMotion();
	const queryClient = useQueryClient();
	const { slug, candidateInitials } = useHousehold();
	const firstOpen = introduction.sealsSeenAt === null || justAccepted;
	const [phase, setPhase] = useState<Phase>(firstOpen ? "sealed" : "open");
	const [unveiling, setUnveiling] = useState(false);
	const [closeOpen, setCloseOpen] = useState(false);
	const [shareError, setShareError] = useState<string | null>(null);
	const markedSeen = useRef(false);
	const markSeen = useMutation(orpc.matches.markSealsSeen.mutationOptions());
	const share = useMutation(orpc.matches.shareContact.mutationOptions());

	// The break plays 300ms after mount (at once for the person who just said yes).
	useEffect(() => {
		if (phase !== "sealed") {
			return;
		}
		const timer = window.setTimeout(
			() => {
				if (!markedSeen.current && introduction.sealsSeenAt === null) {
					markedSeen.current = true;
					markSeen.mutate(
						{ matchId: introduction.id },
						{
							onSuccess: () => {
								void queryClient.invalidateQueries({
									queryKey: orpc.interests.counts.key(),
								});
								void queryClient.invalidateQueries({
									queryKey: orpc.interests.list.key(),
								});
							},
						},
					);
				}
				if (reducedMotion) {
					setPhase("open");
				} else {
					setPhase("breaking");
				}
			},
			justAccepted ? 80 : 300,
		);
		return () => window.clearTimeout(timer);
	}, [phase]); // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps

	useEffect(() => {
		if (phase !== "breaking") {
			return;
		}
		const timer = window.setTimeout(() => {
			setUnveiling(true);
			setPhase("open");
		}, 320);
		return () => window.clearTimeout(timer);
	}, [phase]);

	const them = introduction.them;
	const theirPage = them.page;
	const sealedFields = theirPage.sealed.open ? theirPage.sealed.fields : [];
	const fullName = sealedFields.find((field) => field.key === "fullName")?.value;
	const theirName = fullName ?? theirPage.header.displayName;
	const opened = phase === "open";
	const closed = introduction.closed;
	const sealState = phase === "sealed" ? "pressed" : "broken";

	const shareContact = async (kind: "phone" | "family") => {
		setShareError(null);
		try {
			await share.mutateAsync({ matchId: introduction.id, kind });
			void queryClient.invalidateQueries({ queryKey: orpc.interests.get.key() });
		} catch (error) {
			const code = knownErrorCode(error);
			setShareError(
				code === "NO_PHONE_ON_PAGE"
					? t("share.noPhone")
					: code === "NO_FAMILY_CONTACT"
						? t("share.noFamily")
						: t("share.failed"),
			);
		}
	};

	const person = (
		name: string,
		initials: string,
		city: string | null,
		zone: string,
		own: boolean,
	) => (
		<div className="gap-3 flex flex-col items-center text-center">
			<p className="font-display text-title-sm break-words">{name}</p>
			<MonogramSeal
				initials={initials}
				state={sealState}
				breaking={phase === "breaking"}
				size={64}
				title={own ? t("yourSeal") : t("theirSeal", { name: them.firstName })}
			/>
			<p className="text-meta text-muted-foreground tabular">
				{[cityOf(city), zoneAbbreviation(zone, locale)].filter(Boolean).join(" · ")}
			</p>
		</div>
	);

	return (
		<article
			aria-labelledby="intro-title"
			className="max-md:border-x-0 mx-auto w-full max-w-(--page-width) border border-border bg-card"
		>
			<div aria-hidden="true" className="double-rule" />
			<div className="pt-6 pb-10 page-pad">
				<p className="label-caps text-muted-foreground">
					{t("heading", { date: formatLongDate(introduction.sealsBrokeAt, locale) })}
				</p>
				<h1 id="intro-title" className="sr-only">
					{t("title", { name: them.firstName })}
				</h1>

				<div className="mt-6 gap-6 grid grid-cols-2">
					{person(
						introduction.you.firstName,
						candidateInitials,
						introduction.you.city,
						introduction.you.timeZone,
						true,
					)}
					{person(
						theirName,
						sealInitials(theirName),
						theirPage.header.city ?? null,
						them.timeZone,
						false,
					)}
				</div>
				<p className="sr-only" aria-live="polite">
					{opened ? t("announceOpen", { name: them.firstName }) : ""}
				</p>

				{closed ? (
					<div className="mt-8 p-4 md:p-5 border border-border bg-background">
						<p className="font-display text-letter">
							{closed.byYou
								? t("closed.byYou", { date: formatLongDate(closed.at, locale) })
								: t("closed.byThem", { name: them.firstName })}
						</p>
						{closed.note && (
							<p className="mt-2 font-display text-letter whitespace-pre-line text-muted-foreground">
								“{closed.note}”
							</p>
						)}
					</div>
				) : (
					<p className="mt-6 text-center text-body text-muted-foreground">
						{t(`stage.${introduction.stage}`)}
					</p>
				)}
				{introduction.quietNudge && !closed && (
					<p className="mt-3 text-center pencil text-body">{t("quietNudge")}</p>
				)}

				<section aria-labelledby="intro-open" className="mt-10">
					<h2 id="intro-open" className="hairline-after font-display text-section">
						{t("nowOpen")}
					</h2>
					<div className="mt-4 relative">
						<div className="gap-5 grid grid-cols-[38%_1fr]">
							<div className="gap-2 grid">
								{(theirPage.photos.length > 0
									? theirPage.photos.slice(0, 2)
									: [null]
								).map((photo, index) => (
									<div
										key={photo?.id ?? index}
										className="relative aspect-[4/5] overflow-hidden border border-border bg-veil"
									>
										{phase !== "sealed" && photo?.url ? (
											<UnveilingPhoto
												src={photo.url}
												alt={t("photoAlt", { name: them.firstName })}
												unveil={unveiling}
											/>
										) : (
											<span className="inset-0 p-2 absolute flex items-center justify-center text-center pencil text-meta">
												{opened ? t("noPhoto") : ""}
											</span>
										)}
									</div>
								))}
							</div>
							<dl className="min-w-0">
								{sealedFields.map((field) => (
									<div key={field.key} className="py-1.5">
										<dt className="label-caps text-muted-foreground">
											{text.label(field.key)}
										</dt>
										<dd className="text-body break-words">
											{text.value(field.key, field.value)}
										</dd>
									</div>
								))}
								{them.contact.email && (
									<div className="py-1.5">
										<dt className="label-caps text-muted-foreground">
											{t("contact.email")}
										</dt>
										<dd className="text-body break-all">
											{them.contact.email}
										</dd>
									</div>
								)}
								{them.contact.phone && (
									<div className="py-1.5">
										<dt className="label-caps text-muted-foreground">
											{t("contact.phone")}
										</dt>
										<dd className="text-body tabular">{them.contact.phone}</dd>
									</div>
								)}
								{them.contact.family && (
									<div className="py-1.5">
										<dt className="label-caps text-muted-foreground">
											{t("contact.family")}
										</dt>
										<dd className="text-body">
											{them.contact.family.name} ·{" "}
											<span className="tabular">
												{them.contact.family.phone}
											</span>
										</dd>
									</div>
								)}
							</dl>
						</div>
						{!opened && (
							<div
								aria-hidden="true"
								className="inset-0 absolute border border-dashed border-border bg-sealed"
							/>
						)}
						{opened && unveiling && (
							<div
								aria-hidden="true"
								className="inset-0 animate-veil-lift pointer-events-none absolute bg-sealed"
							/>
						)}
					</div>

					{!closed && (
						<div className="mt-6 gap-3 flex flex-col">
							{!introduction.you.phoneShared ? (
								<div className="gap-3 flex flex-wrap items-center">
									<Button
										variant="outline"
										size="sm"
										loading={
											share.isPending && share.variables?.kind === "phone"
										}
										onClick={() => void shareContact("phone")}
									>
										{t("share.phone")}
									</Button>
									<span className="text-meta text-muted-foreground">
										{t("share.phoneNote", { name: them.firstName })}
									</span>
								</div>
							) : (
								<p className="text-meta text-muted-foreground">
									{t("share.phoneShared", { name: them.firstName })}
								</p>
							)}
							<div className="pt-3 border-t border-border">
								<p className="text-body">{t("share.familyLead")}</p>
								{introduction.you.familyShared ? (
									<p className="mt-1 text-meta text-muted-foreground">
										{them.familyShared
											? t("share.familyBoth")
											: t("share.familyYours", { name: them.firstName })}
									</p>
								) : (
									<Button
										variant="outline"
										size="sm"
										className="mt-2"
										loading={
											share.isPending && share.variables?.kind === "family"
										}
										onClick={() => void shareContact("family")}
									>
										{t("share.family")}
									</Button>
								)}
							</div>
							{shareError && (
								<p role="alert" className="text-body text-destructive">
									{shareError}{" "}
									<Link
										href={`/${slug}/biodata`}
										className="text-seal-ink underline-offset-4 hover:underline"
									>
										{t("share.openPage")}
									</Link>
								</p>
							)}
						</div>
					)}
				</section>

				<ProposeThreeTimes introduction={introduction} />

				<Correspondence
					matchId={introduction.id}
					theirName={them.firstName}
					closed={Boolean(closed)}
					onReport={onReportMessage}
				/>

				<footer className="mt-10 gap-x-6 gap-y-2 pt-5 flex flex-wrap items-center border-t border-border">
					<Link
						href={`/b/${theirPage.handle}`}
						className="min-h-11 inline-flex items-center text-ui text-seal-ink underline-offset-4 hover:underline"
					>
						{t("readPage", { name: them.firstName })}
					</Link>
					{!closed && (
						<button
							type="button"
							onClick={() => setCloseOpen(true)}
							className="min-h-11 text-ui text-foreground underline-offset-4 hover:underline"
						>
							{t("closeKindly")}
						</button>
					)}
					<button
						type="button"
						onClick={onReport}
						className="min-h-11 text-ui text-muted-foreground underline-offset-4 hover:underline"
					>
						{t("report")}
					</button>
					<button
						type="button"
						onClick={onBlock}
						className="min-h-11 text-ui text-muted-foreground underline-offset-4 hover:underline"
					>
						{t("block")}
					</button>
				</footer>
			</div>

			<CloseKindlySheet
				open={closeOpen}
				onOpenChange={setCloseOpen}
				matchId={introduction.id}
				theirName={them.firstName}
				yourName={introduction.you.firstName}
			/>
		</article>
	);
}
