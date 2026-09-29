"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Textarea } from "@repo/ui";
import { RowsSkeleton } from "@shared/components/PaperSkeleton";
import { formatDateTime } from "@shared/lib/format";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { SafetyNote } from "./NoteSlip";

const schema = z.object({ content: z.string().trim().min(1).max(2000) });

/**
 * Correspondence inside an introduction (design.md §5.6): letters in Tiro, no bubbles, no ticks,
 * no typing dots. Polled every 3 seconds while open and refetched on focus; one quiet "Read"
 * line under your last message. A failed send keeps the draft.
 */
export function Correspondence({
	matchId,
	theirName,
	closed,
	onReport,
}: {
	matchId: string;
	theirName: string;
	closed: boolean;
	onReport: (messageId: string) => void;
}) {
	const t = useTranslations("intro.letters");
	const locale = useLocale();
	const queryClient = useQueryClient();
	const bottomRef = useRef<HTMLDivElement>(null);

	const query = useInfiniteQuery({
		...orpc.messages.list.infiniteOptions({
			input: (cursor: string | undefined) => ({ matchId, cursor }),
			initialPageParam: undefined,
			getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		}),
		refetchInterval: 3000,
		refetchIntervalInBackground: false,
		refetchOnWindowFocus: true,
	});

	const messages = useMemo(
		() => [...(query.data?.pages ?? [])].reverse().flatMap((page) => page.items),
		[query.data],
	);

	const markRead = useMutation(orpc.messages.markRead.mutationOptions());
	const unreadFromThem = messages.some((message) => !message.fromMe && !message.read);
	useEffect(() => {
		if (unreadFromThem && !markRead.isPending) {
			markRead.mutate(
				{ matchId },
				{
					onSuccess: () => {
						void queryClient.invalidateQueries({
							queryKey: orpc.interests.counts.key(),
						});
						void queryClient.invalidateQueries({ queryKey: orpc.interests.list.key() });
					},
				},
			);
		}
	}, [unreadFromThem, matchId]); // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps

	const send = useMutation(orpc.messages.send.mutationOptions());
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { content: "" },
	});

	const onSubmit = form.handleSubmit(async ({ content }) => {
		form.clearErrors("root");
		try {
			await send.mutateAsync({ matchId, content });
			form.reset({ content: "" });
			await query.refetch();
			bottomRef.current?.scrollIntoView({ block: "end" });
		} catch {
			form.setError("root", { message: t("notSent") });
		}
	});

	const lastMine = [...messages].reverse().find((message) => message.fromMe);

	return (
		<section aria-labelledby="intro-letters" className="mt-10">
			<h2 id="intro-letters" className="hairline-after font-display text-section">
				{t("title")}
			</h2>

			{query.hasNextPage && (
				<button
					type="button"
					onClick={() => void query.fetchNextPage()}
					className="mt-3 min-h-11 text-ui text-seal-ink underline-offset-4 hover:underline"
				>
					{t("earlier")}
				</button>
			)}

			{query.isPending ? (
				<RowsSkeleton rows={2} className="mt-2" />
			) : query.isError && messages.length === 0 ? (
				<p className="mt-3 text-body text-muted-foreground">
					{t("error")}{" "}
					<button
						type="button"
						onClick={() => void query.refetch()}
						className="text-seal-ink underline-offset-4 hover:underline"
					>
						{t("tryAgain")}
					</button>
				</p>
			) : messages.length === 0 ? (
				<p className="mt-3 pencil text-body">{t("empty", { name: theirName })}</p>
			) : (
				<ol className="mt-2">
					{messages.map((message) => (
						<li
							key={message.id}
							className="py-4 border-b border-border/70 last:border-b-0"
						>
							<p className="text-meta text-muted-foreground tabular">
								{message.fromMe ? t("you") : theirName} ·{" "}
								{formatDateTime(message.createdAt, locale)}
							</p>
							{message.safetyFlag && (
								<div className="mt-2">
									<SafetyNote
										compact
										category={message.safetyFlag.category}
										onReport={() => onReport(message.id)}
									/>
								</div>
							)}
							<p className="mt-1 max-w-[36em] font-display text-letter break-words whitespace-pre-line">
								{message.content}
							</p>
							{message.id === lastMine?.id && message.read && (
								<p className="mt-1 text-right text-meta text-muted-foreground">
									{t("read")}
								</p>
							)}
						</li>
					))}
				</ol>
			)}
			<div ref={bottomRef} />

			{closed ? (
				<p className="mt-4 text-body text-muted-foreground">{t("closedNote")}</p>
			) : (
				<form onSubmit={onSubmit} className="mt-4 gap-3 flex flex-col" noValidate>
					<label className="sr-only" htmlFor={`write-${matchId}`}>
						{t("writeTo", { name: theirName })}
					</label>
					<Textarea
						id={`write-${matchId}`}
						{...form.register("content")}
						rows={3}
						maxLength={2000}
						placeholder={t("writeTo", { name: theirName })}
						className="font-display text-letter"
						onKeyDown={(event) => {
							if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
								event.preventDefault();
								void onSubmit();
							}
						}}
					/>
					{form.formState.errors.root && (
						<p role="alert" className="text-body text-destructive">
							{form.formState.errors.root.message}{" "}
							<button
								type="submit"
								className="text-seal-ink underline-offset-4 hover:underline"
							>
								{t("tryAgain")}
							</button>
						</p>
					)}
					<div>
						<Button
							type="submit"
							variant="secondary"
							loading={form.formState.isSubmitting}
						>
							{t("send")}
						</Button>
					</div>
				</form>
			)}
		</section>
	);
}
