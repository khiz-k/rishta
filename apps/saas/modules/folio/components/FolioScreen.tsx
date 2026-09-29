"use client";

import { useHousehold } from "@household/components/HouseholdProvider";
import { Button } from "@repo/ui";
import { PaperSkeleton } from "@shared/components/PaperSkeleton";
import { PaperSlip } from "@shared/components/PaperSlip";
import { useShellContextLine } from "@shared/components/shell/ShellContext";
import { errorStatus } from "@shared/lib/errors";
import { formatTime, formatWeekday } from "@shared/lib/format";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo } from "react";

import { fromFolioPage } from "../lib/reader";
import { FolioEndSlip } from "./FolioEndSlip";
import { FolioReader } from "./FolioReader";

function releaseWeekday(releaseDate: string, locale: string) {
	return formatWeekday(`${releaseDate}T12:00:00Z`, locale, "UTC");
}

function Centered({ children }: { children: React.ReactNode }) {
	return (
		<div className="px-4 md:px-6 pt-6 md:pt-14 mx-auto max-w-(--page-width)">{children}</div>
	);
}

/**
 * The Folio (home): today's 5 (Free) or 7 (Premium) complete pages, released each evening.
 * Every state is designed: the first release, a locked folio, nothing today, a page closed
 * mid-read, the end, and an error that keeps cached pages readable.
 */
export function FolioScreen() {
	const t = useTranslations("folio");
	const locale = useLocale();
	const { organizationId, slug, candidateFirstName, abilities } = useHousehold();
	const queryClient = useQueryClient();
	const query = useQuery({
		...orpc.folio.today.queryOptions({ input: { organizationId } }),
		refetchOnWindowFocus: true,
	});
	const resume = useMutation({
		...orpc.profiles.resume.mutationOptions(),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: orpc.folio.key() });
			void queryClient.invalidateQueries({ queryKey: orpc.households.get.key() });
		},
	});

	const data = query.data;
	const items = useMemo(() => (data ? data.pages.map(fromFolioPage) : []), [data]);
	const title = data?.releaseDate
		? t("title", { weekday: releaseWeekday(data.releaseDate, locale) })
		: t("titleFallback");

	useShellContextLine(data && items.length > 0 && !data.locked ? undefined : t("titleFallback"));

	if (!data) {
		if (query.isError) {
			const forbidden = errorStatus(query.error) === "FORBIDDEN";
			return (
				<Centered>
					<PaperSlip
						role="alert"
						title={forbidden ? t("private", { name: candidateFirstName }) : t("error")}
						actions={
							forbidden ? null : (
								<Button variant="secondary" onClick={() => void query.refetch()}>
									{t("tryAgain")}
								</Button>
							)
						}
					/>
				</Centered>
			);
		}
		return (
			<div className="md:px-6 pt-3 md:pt-10">
				<PaperSkeleton />
			</div>
		);
	}

	if (data.locked) {
		const lockedCopy = {
			awaiting_claim: t("locked.awaitingClaim", { name: candidateFirstName }),
			unpublished: abilities.isCandidate
				? t("locked.unpublishedYou")
				: t("locked.unpublished", { name: candidateFirstName }),
			paused: abilities.isCandidate
				? t("locked.pausedYou")
				: t("locked.paused", { name: candidateFirstName }),
			closed: t("locked.closed", { name: candidateFirstName }),
		}[data.locked];
		return (
			<Centered>
				<PaperSlip
					title={lockedCopy}
					tone="sealed"
					actions={
						data.locked === "paused" && abilities.isCandidate ? (
							<Button
								variant="secondary"
								loading={resume.isPending}
								onClick={() => resume.mutate({ organizationId })}
							>
								{t("locked.resume")}
							</Button>
						) : data.locked === "awaiting_claim" || data.locked === "unpublished" ? (
							<Link
								href={`/${slug}/biodata`}
								className="text-ui text-seal-ink underline-offset-4 hover:underline"
							>
								{t("locked.openPage")}
							</Link>
						) : null
					}
				>
					{data.locked === "paused" && abilities.isCandidate
						? t("locked.pausedNote")
						: null}
				</PaperSlip>
			</Centered>
		);
	}

	if (data.firstRelease) {
		return (
			<Centered>
				<PaperSlip title={t("first", { time: formatTime(data.nextReleaseAt, locale) })}>
					{t("firstNote")}
				</PaperSlip>
			</Centered>
		);
	}

	if (items.length === 0) {
		return (
			<Centered>
				<PaperSlip
					title={t("empty.title")}
					actions={
						<Link
							href={`/${slug}/biodata/looking-for`}
							className="text-ui text-seal-ink underline-offset-4 hover:underline"
						>
							{t("empty.link")}
						</Link>
					}
				>
					{t("empty.body")}
				</PaperSlip>
			</Centered>
		);
	}

	return (
		<>
			{query.isError && (
				<div className="px-4 md:px-6 pt-4 mx-auto max-w-(--page-width)">
					<PaperSlip
						role="alert"
						tone="caution"
						title={t("errorCached")}
						actions={
							<Button variant="ghost" size="sm" onClick={() => void query.refetch()}>
								{t("tryAgain")}
							</Button>
						}
					/>
				</div>
			)}
			<FolioReader
				items={items}
				mode="folio"
				title={title}
				scriptDay={(language) =>
					data?.releaseDate && language !== "en"
						? releaseWeekday(data.releaseDate, language)
						: null
				}
				counterLabel={(position, total) => t("counter", { position, total })}
				railSummary={(all) => {
					const kept = all.filter((item) => item.kept).length;
					const wrote = all.filter((item) => item.myLetter).length;
					return (
						<Link
							href={`/${slug}/folio/kept`}
							className="underline-offset-4 hover:text-foreground hover:underline"
						>
							{kept > 0 || wrote > 0
								? t("railSummary", { kept, wrote })
								: t("keptLink")}
						</Link>
					);
				}}
				renderEnd={({ items: all, onUndoPass }) => (
					<FolioEndSlip
						items={all}
						nextReleaseAt={data.nextReleaseAt}
						onUndoPass={onUndoPass}
					/>
				)}
			/>
		</>
	);
}
