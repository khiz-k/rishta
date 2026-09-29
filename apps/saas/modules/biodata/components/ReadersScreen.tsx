"use client";

import { useHousehold } from "@household/components/HouseholdProvider";
import { Button, Checkbox } from "@repo/ui";
import { RowsSkeleton } from "@shared/components/PaperSkeleton";
import { PaperSlip } from "@shared/components/PaperSlip";
import { useShellContextLine } from "@shared/components/shell/ShellContext";
import { formatWeekday, formatShortDate, daysSince } from "@shared/lib/format";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";

/**
 * Readers (design.md §5.13): "Harpreet Singh read your page · Tuesday". No photos and no totals
 * headline; blocked people never appear. Reading privately is free, as a safety feature.
 */
export function ReadersScreen() {
	const t = useTranslations("readers");
	const locale = useLocale();
	const { organizationId, household, abilities } = useHousehold();
	const queryClient = useQueryClient();
	const form = useForm<{ readIncognito: boolean }>({
		defaultValues: { readIncognito: household.settings.readIncognito },
	});
	const update = useMutation(orpc.households.updateSettings.mutationOptions());

	useShellContextLine(t("title"));

	const query = useInfiniteQuery({
		...orpc.profiles.readers.infiniteOptions({
			input: (cursor: string | undefined) => ({ organizationId, cursor }),
			initialPageParam: undefined,
			getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		}),
		enabled: abilities.isCandidate,
	});
	const items = query.data?.pages.flatMap((page) => page.items) ?? [];

	const when = (readAt: string) =>
		daysSince(readAt) < 7 ? formatWeekday(readAt, locale) : formatShortDate(readAt, locale);

	const toggleIncognito = async (next: boolean) => {
		form.setValue("readIncognito", next);
		try {
			await update.mutateAsync({ organizationId, readIncognito: next });
			void queryClient.invalidateQueries({ queryKey: orpc.households.get.key() });
		} catch {
			form.setValue("readIncognito", !next);
		}
	};

	if (!abilities.isCandidate) {
		return (
			<div className="px-4 md:px-6 pt-6 md:pt-14 mx-auto max-w-(--page-width)">
				<PaperSlip title={t("private")} />
			</div>
		);
	}

	return (
		<div className="px-0 md:px-6 pt-3 md:pt-10 mx-auto max-w-(--page-width)">
			<div className="max-md:border-x-0 border border-border bg-card">
				<div aria-hidden="true" className="double-rule" />
				<div className="pt-6 pb-10 page-pad">
					<h1 className="font-display text-title">{t("title")}</h1>
					<Controller
						control={form.control}
						name="readIncognito"
						render={({ field }) => (
							<label
								htmlFor="read-incognito"
								className="mt-5 gap-3 p-4 flex cursor-pointer items-start border border-border bg-background"
							>
								<Checkbox
									id="read-incognito"
									checked={field.value}
									onCheckedChange={(checked) =>
										void toggleIncognito(checked === true)
									}
									className="mt-1"
									disabled={update.isPending}
								/>
								<span>
									<span className="font-semibold block text-body [font-stretch:87.5%]">
										{t("incognito", {
											state: field.value ? t("on") : t("off"),
										})}
									</span>
									<span className="block text-meta text-muted-foreground">
										{t("incognitoNote")}
									</span>
								</span>
							</label>
						)}
					/>
					{update.isError && (
						<p className="mt-2 text-meta text-destructive">{t("notSaved")}</p>
					)}

					<div className="mt-8">
						{query.isPending ? (
							<RowsSkeleton rows={4} />
						) : query.isError ? (
							<p className="text-body text-muted-foreground">
								{t("error")}{" "}
								<button
									type="button"
									onClick={() => void query.refetch()}
									className="text-seal-ink underline-offset-4 hover:underline"
								>
									{t("tryAgain")}
								</button>
							</p>
						) : items.length === 0 ? (
							<p className="pencil text-body">{t("empty")}</p>
						) : (
							<ul className="border-t border-border">
								{items.map((reader) => (
									<li
										key={`${reader.handle}-${reader.readAt}`}
										className="border-b border-border"
									>
										<Link
											href={`/b/${reader.handle}`}
											className="py-3.5 gap-x-3 flex flex-wrap items-baseline hover:bg-accent/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
										>
											<span className="font-display text-letter">
												{t("line", { name: reader.displayName })}
											</span>
											<span className="text-meta text-muted-foreground tabular">
												· {when(reader.readAt)}
											</span>
										</Link>
									</li>
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
								{t("earlier")}
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
