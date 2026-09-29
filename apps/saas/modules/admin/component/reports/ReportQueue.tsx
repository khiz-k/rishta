"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { REPORT_STATUSES, type ReportStatus } from "@repo/database/drizzle/domain";
import { Badge, Button, Checkbox, cn, Textarea } from "@repo/ui";
import { RowsSkeleton } from "@shared/components/PaperSkeleton";
import { PaperSlip } from "@shared/components/PaperSlip";
import type { ReportRow } from "@shared/lib/api-types";
import { formatDateTime } from "@shared/lib/format";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const resolveSchema = z.object({
	moderatorNote: z.string().trim().max(2000),
	pausePage: z.boolean(),
});

function ReportItem({ report, onChanged }: { report: ReportRow; onChanged: () => void }) {
	const t = useTranslations("admin.reports");
	const tCategories = useTranslations("report.categories");
	const locale = useLocale();
	const resolve = useMutation(orpc.reports.resolve.mutationOptions());
	const form = useForm<z.infer<typeof resolveSchema>>({
		resolver: zodResolver(resolveSchema),
		defaultValues: { moderatorNote: report.moderatorNote ?? "", pausePage: false },
	});

	const act = (status: "reviewing" | "actioned" | "dismissed") =>
		form.handleSubmit(async (values) => {
			await resolve.mutateAsync({
				reportId: report.id,
				status,
				moderatorNote: values.moderatorNote.length > 0 ? values.moderatorNote : undefined,
				pausePage: status === "actioned" ? values.pausePage : undefined,
			});
			onChanged();
		})();

	const settled = report.status === "actioned" || report.status === "dismissed";

	return (
		<li className="p-5 border border-border bg-card">
			<div className="gap-3 flex flex-wrap items-center justify-between">
				<p className="font-display text-letter">{tCategories(report.category)}</p>
				<Badge status={settled ? "neutral" : report.status === "open" ? "warning" : "info"}>
					{t(`status.${report.status}`)}
				</Badge>
			</div>
			<p className="mt-1 text-meta text-muted-foreground tabular">
				{t("filed", {
					date: formatDateTime(report.createdAt, locale),
					context: t(`context.${report.context}`),
				})}
				{report.fromFamilyLink ? ` · ${t("fromFamilyLink")}` : ""}
			</p>
			{report.reportedPage && (
				<p className="mt-2 text-body">
					{t("about")}{" "}
					<a
						href={`/b/${report.reportedPage.handle}`}
						className="text-seal-ink underline-offset-4 hover:underline"
					>
						{report.reportedPage.displayName}
					</a>
				</p>
			)}
			{report.snippet && (
				<blockquote className="mt-3 px-4 py-3 border-l-2 border-border bg-background font-display text-letter whitespace-pre-line">
					{report.snippet}
				</blockquote>
			)}
			{report.details && <p className="mt-3 text-body">{report.details}</p>}

			{!settled && (
				<form
					className="mt-4 gap-3 flex flex-col"
					onSubmit={(event) => event.preventDefault()}
					noValidate
				>
					<label className="gap-1.5 flex flex-col">
						<span className="label-caps text-muted-foreground">{t("note")}</span>
						<Textarea {...form.register("moderatorNote")} rows={2} maxLength={2000} />
					</label>
					<Controller
						control={form.control}
						name="pausePage"
						render={({ field }) => (
							<label className="gap-3 flex items-center">
								<Checkbox
									checked={field.value}
									onCheckedChange={(checked) => field.onChange(checked === true)}
								/>
								<span className="text-body">{t("pausePage")}</span>
							</label>
						)}
					/>
					<div className="gap-2 flex flex-wrap">
						{report.status === "open" && (
							<Button
								size="sm"
								variant="outline"
								loading={resolve.isPending}
								onClick={() => void act("reviewing")}
							>
								{t("actions.review")}
							</Button>
						)}
						<Button
							size="sm"
							variant="secondary"
							loading={resolve.isPending}
							onClick={() => void act("actioned")}
						>
							{t("actions.action")}
						</Button>
						<Button
							size="sm"
							variant="ghost"
							loading={resolve.isPending}
							onClick={() => void act("dismissed")}
						>
							{t("actions.dismiss")}
						</Button>
					</div>
					{resolve.isError && <p className="text-meta text-destructive">{t("failed")}</p>}
				</form>
			)}
			{settled && report.moderatorNote && (
				<p className="mt-3 pencil text-body">{report.moderatorNote}</p>
			)}
		</li>
	);
}

/** The moderation queue (spec.md F12): open → reviewing → actioned or dismissed, with notes. */
export function ReportQueue() {
	const t = useTranslations("admin.reports");
	const [status, setStatus] = useQueryState(
		"status",
		parseAsStringEnum<ReportStatus>([...REPORT_STATUSES]).withDefault("open"),
	);
	const query = useInfiniteQuery({
		...orpc.reports.list.infiniteOptions({
			input: (cursor: string | undefined) => ({ status, cursor }),
			initialPageParam: undefined,
			getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		}),
	});
	const items = query.data?.pages.flatMap((page) => page.items) ?? [];

	return (
		<div>
			<div
				role="tablist"
				aria-label={t("filter")}
				className="gap-5 flex border-b border-border"
			>
				{REPORT_STATUSES.map((value) => (
					<button
						key={value}
						type="button"
						role="tab"
						aria-selected={status === value}
						onClick={() => void setStatus(value)}
						className={cn(
							"min-h-11 -mb-px border-b-2 nav-caps",
							status === value
								? "border-foreground text-foreground"
								: "border-transparent text-muted-foreground",
						)}
					>
						{t(`status.${value}`)}
					</button>
				))}
			</div>
			<div className="mt-6">
				{query.isPending ? (
					<RowsSkeleton rows={3} />
				) : query.isError ? (
					<PaperSlip
						role="alert"
						title={t("error")}
						actions={
							<Button variant="secondary" onClick={() => void query.refetch()}>
								{t("tryAgain")}
							</Button>
						}
					/>
				) : items.length === 0 ? (
					<PaperSlip title={t("empty")} />
				) : (
					<ul className="gap-4 flex flex-col">
						{items.map((report) => (
							<ReportItem
								key={report.id}
								report={report}
								onChanged={() => void query.refetch()}
							/>
						))}
					</ul>
				)}
				{query.hasNextPage && (
					<Button
						variant="ghost"
						className="mt-4"
						loading={query.isFetchingNextPage}
						onClick={() => void query.fetchNextPage()}
					>
						{t("more")}
					</Button>
				)}
			</div>
		</div>
	);
}
