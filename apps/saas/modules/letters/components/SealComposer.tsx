"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHousehold } from "@household/components/HouseholdProvider";
import {
	containsSuggestionVerbatim,
	findContactDetails,
	NOTE_MAX_LENGTH,
	NOTE_MIN_LENGTH,
} from "@repo/api/modules/interests/lib/note-rules";
import { Button, Checkbox, cn } from "@repo/ui";
import { errorLetterId, knownErrorCode } from "@shared/lib/errors";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { clearDraft, newIdempotencyKey, readDraft, writeDraft } from "../lib/drafts";
import { SealButton, type SealStatus } from "./SealButton";

const schema = z.object({
	note: z.string().max(NOTE_MAX_LENGTH),
	priority: z.boolean(),
});
type Values = z.infer<typeof schema>;

type Blocker =
	| { kind: "daily_limit" }
	| { kind: "already_wrote_to_you"; letterId: string | null }
	| { kind: "already_wrote"; letterId: string | null }
	| { kind: "page_closed" }
	| { kind: "not_a_fit" }
	| { kind: "unpublished" };

/** Announce the counter politely, at most once every 2 seconds (design.md §6.1). */
function useThrottledAnnouncement(message: string, intervalMs = 2000) {
	const [announced, setAnnounced] = useState(message);
	const last = useRef(0);
	useEffect(() => {
		const now = Date.now();
		const wait = Math.max(0, intervalMs - (now - last.current));
		const timer = window.setTimeout(() => {
			last.current = Date.now();
			setAnnounced(message);
		}, wait);
		return () => window.clearTimeout(timer);
	}, [message, intervalMs]);
	return announced;
}

/**
 * The seal composer (design.md §5.3, §6.1): a 1-3 sentence note (40-400 characters) with the
 * salutation set automatically and the signer line previewed. The seal stays locked under 40
 * characters, while a suggested first line is still there word for word, or while the note
 * carries contact details. A priority note costs one credit and is always labelled for her.
 */
export function SealComposer({
	handle,
	recipientFirstName,
	onClose,
	onSent,
	variant,
}: {
	handle: string;
	recipientFirstName: string;
	onClose: () => void;
	onSent: (letterId: string) => void;
	variant: "sheet" | "margin";
}) {
	const t = useTranslations("composer");
	const { organizationId, slug, household, userFirstName, candidateInitials } = useHousehold();
	const queryClient = useQueryClient();
	const textareaId = useId();
	const lockId = useId();
	const idempotencyKey = useRef(newIdempotencyKey());
	const [status, setStatus] = useState<SealStatus>("idle");
	const [blocker, setBlocker] = useState<Blocker | null>(null);
	const [errorLine, setErrorLine] = useState<string | null>(null);
	const [announcement, setAnnouncement] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { note: readDraft(organizationId, handle), priority: false },
	});
	const note = useWatch({ control: form.control, name: "note" }) ?? "";
	const priority = useWatch({ control: form.control, name: "priority" });

	// Keep the draft as it is written.
	useEffect(() => {
		const subscription = form.watch((values) => {
			writeDraft(organizationId, handle, values.note ?? "");
		});
		return () => subscription.unsubscribe();
	}, [form, organizationId, handle]);

	const { data: wallet } = useQuery({
		...orpc.wallet.get.queryOptions({ input: { organizationId } }),
		staleTime: 60_000,
	});
	const credits = wallet?.credits ?? 0;

	// A first line, if you'd like one: built from real overlaps (AI, or a template without it).
	const suggest = useMutation(orpc.ai.suggestFirstLine.mutationOptions());
	const suggestRequested = useRef(false);
	useEffect(() => {
		if (suggestRequested.current) {
			return;
		}
		suggestRequested.current = true;
		suggest.mutate({ organizationId, toHandle: handle });
	}, [organizationId, handle]); // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps
	const suggestion = suggest.data ?? null;

	const send = useMutation(orpc.interests.send.mutationOptions());

	const trimmed = note.trim();
	const length = trimmed.length;
	const contact = findContactDetails(trimmed);
	const verbatim = suggestion ? containsSuggestionVerbatim(trimmed, [suggestion.line]) : false;
	const tooShort = length < NOTE_MIN_LENGTH;
	const locked = tooShort || verbatim || contact !== null;

	const lockMessage = contact
		? t("lock.contact")
		: verbatim
			? t("lock.suggestion")
			: tooShort
				? t("counter.more", { count: NOTE_MIN_LENGTH - length })
				: null;

	const counter = tooShort
		? t("counter.more", { count: NOTE_MIN_LENGTH - length })
		: t("counter.ready", { count: length, max: NOTE_MAX_LENGTH });
	const announcedCounter = useThrottledAnnouncement(counter);

	const insertSuggestion = () => {
		if (!suggestion) {
			return;
		}
		const current = form.getValues("note");
		const next =
			current.trim().length > 0
				? `${suggestion.line} ${current.trim()}`
				: `${suggestion.line} `;
		form.setValue("note", next.slice(0, NOTE_MAX_LENGTH), { shouldDirty: true });
		textareaRef.current?.focus();
	};

	const seal = async (useCredit = false) => {
		setStatus("sending");
		setErrorLine(null);
		const values = form.getValues();
		try {
			const result = await send.mutateAsync({
				organizationId,
				toHandle: handle,
				note: values.note.trim(),
				priority: values.priority,
				useCredit: useCredit || undefined,
				suggestionId: suggestion?.suggestionId,
				idempotencyKey: idempotencyKey.current,
			});
			setStatus("sent");
			setAnnouncement(t("announce.sent"));
			clearDraft(organizationId, handle);
			void queryClient.invalidateQueries({ queryKey: orpc.folio.key() });
			void queryClient.invalidateQueries({ queryKey: orpc.interests.key() });
			void queryClient.invalidateQueries({ queryKey: orpc.profiles.getPage.key() });
			void queryClient.invalidateQueries({ queryKey: orpc.wallet.key() });
			// Let the 220ms press finish before the sheet settles.
			window.setTimeout(() => onSent(result.letterId), 260);
		} catch (error) {
			const code = knownErrorCode(error);
			setStatus("failed");
			switch (code) {
				case "DAILY_LIMIT":
					setBlocker({ kind: "daily_limit" });
					break;
				case "ALREADY_WROTE_TO_YOU":
					setBlocker({ kind: "already_wrote_to_you", letterId: errorLetterId(error) });
					break;
				case "ALREADY_WROTE":
				case "LETTER_EXISTS":
					setBlocker({ kind: "already_wrote", letterId: errorLetterId(error) });
					break;
				case "PAGE_UNAVAILABLE":
				case "PAGE_NOT_FOUND":
					setBlocker({ kind: "page_closed" });
					break;
				case "NOT_A_FIT":
					setBlocker({ kind: "not_a_fit" });
					break;
				case "PAGE_NOT_ACTIVE":
					setBlocker({ kind: "unpublished" });
					break;
				case "CONTACT_IN_NOTE":
					setErrorLine(t("lock.contact"));
					break;
				case "SUGGESTION_UNEDITED":
					setErrorLine(t("lock.suggestion"));
					break;
				case "NOT_ENOUGH_CREDITS":
					setErrorLine(t("priority.noCredits"));
					form.setValue("priority", false);
					break;
				default:
					setErrorLine(t("error.network"));
			}
			// Back to idle after the lift, so the seal can be pressed again.
			window.setTimeout(() => setStatus("idle"), 160);
		}
	};

	const signerPreview = useMemo(() => {
		const name = userFirstName;
		return household.page && household.isCandidate
			? t("signer", { name })
			: t("signer", { name: household.candidate.firstName });
	}, [household, t, userFirstName]);

	const blockerView = blocker && (
		<div role="status" className="gap-3 px-4 py-4 flex flex-col border border-border bg-card">
			{blocker.kind === "daily_limit" && (
				<>
					<p className="font-display text-letter">{t("blocker.dailyLimit")}</p>
					{credits > 0 ? (
						<div>
							<Button
								type="button"
								variant="primary"
								onClick={() => {
									setBlocker(null);
									void seal(true);
								}}
							>
								{t("blocker.useCredit")}
							</Button>
						</div>
					) : (
						<Link
							href={`/${slug}/settings/billing`}
							className="text-ui text-seal-ink underline-offset-4 hover:underline"
						>
							{t("priority.buy")}
						</Link>
					)}
				</>
			)}
			{blocker.kind === "already_wrote_to_you" && (
				<>
					<p className="font-display text-letter">
						{t("blocker.alreadyWroteToYou", { name: recipientFirstName })}
					</p>
					{blocker.letterId && (
						<Link
							href={`/${slug}/letters/${blocker.letterId}`}
							className="text-ui text-seal-ink underline-offset-4 hover:underline"
						>
							{t("blocker.readTheirLetter")}
						</Link>
					)}
				</>
			)}
			{blocker.kind === "already_wrote" && (
				<>
					<p className="font-display text-letter">
						{t("blocker.alreadyWrote", { name: recipientFirstName })}
					</p>
					{blocker.letterId && (
						<Link
							href={`/${slug}/letters/${blocker.letterId}`}
							className="text-ui text-seal-ink underline-offset-4 hover:underline"
						>
							{t("blocker.openLetter")}
						</Link>
					)}
				</>
			)}
			{blocker.kind === "page_closed" && (
				<p className="font-display text-letter">{t("blocker.pageClosed")}</p>
			)}
			{blocker.kind === "not_a_fit" && (
				<p className="font-display text-letter">
					{t("blocker.notAFit", { name: recipientFirstName })}
				</p>
			)}
			{blocker.kind === "unpublished" && (
				<>
					<p className="font-display text-letter">{t("blocker.unpublished")}</p>
					<Link
						href={`/${slug}/biodata`}
						className="text-ui text-seal-ink underline-offset-4 hover:underline"
					>
						{t("blocker.openMyPage")}
					</Link>
				</>
			)}
		</div>
	);

	return (
		<section
			aria-labelledby={variant === "margin" ? `${textareaId}-title` : undefined}
			className={cn("flex flex-col", variant === "margin" ? "gap-4" : "gap-4 pb-6")}
		>
			{variant === "margin" && (
				<div className="gap-3 flex items-start justify-between">
					<h2 id={`${textareaId}-title`} className="font-display text-section">
						{t("title", { name: recipientFirstName })}
					</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label={t("close")}
						className="size-11 -mt-2 -mr-3 inline-flex shrink-0 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
					>
						<XIcon className="size-5" />
					</button>
				</div>
			)}

			<form
				onSubmit={(event) => event.preventDefault()}
				className="gap-3 flex flex-col"
				noValidate
			>
				<label htmlFor={textareaId} className="font-display text-letter italic">
					{t("salutation", { name: recipientFirstName })}
				</label>
				<Controller
					control={form.control}
					name="note"
					render={({ field }) => (
						<textarea
							{...field}
							ref={(element) => {
								field.ref(element);
								textareaRef.current = element;
							}}
							id={textareaId}
							rows={variant === "margin" ? 7 : 6}
							maxLength={NOTE_MAX_LENGTH}
							disabled={status === "sending" || status === "sent"}
							aria-describedby={`${textareaId}-counter ${lockId}`}
							className="px-3 py-2.5 w-full resize-none border border-input bg-card font-display text-letter text-foreground placeholder:text-pencil focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
							placeholder={t("placeholder", { name: recipientFirstName })}
						/>
					)}
				/>

				{suggest.isPending && (
					<p role="status" className="pencil text-meta">
						{t("suggestion.finding")}
					</p>
				)}
				{suggestion && !verbatim && length < 200 && (
					<div className="text-body">
						<span className="text-muted-foreground">{t("suggestion.lead")} </span>
						<span className="pencil">“{suggestion.line}”</span>{" "}
						<button
							type="button"
							onClick={insertSuggestion}
							className="min-h-11 px-1 inline-flex items-center text-ui text-seal-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
						>
							{t("suggestion.use")} <span aria-hidden="true">↵</span>
						</button>
					</div>
				)}

				<p id={`${textareaId}-counter`} className="text-meta text-muted-foreground tabular">
					{counter}
				</p>
				<p className="sr-only" aria-live="polite">
					{announcedCounter}
				</p>
				<p className="sr-only" aria-live="polite" role="status">
					{announcement}
				</p>

				{(contact || verbatim) && (
					<p id={lockId} className="text-body text-warning">
						{lockMessage}
					</p>
				)}
				{!contact && !verbatim && (
					<span id={lockId} className="sr-only">
						{lockMessage}
					</span>
				)}

				<Controller
					control={form.control}
					name="priority"
					render={({ field }) => (
						<div className="gap-1">
							<label
								className={cn(
									"gap-3 min-h-11 flex items-center",
									credits > 0
										? "cursor-pointer"
										: "cursor-not-allowed opacity-70",
								)}
							>
								<Checkbox
									checked={field.value}
									disabled={credits === 0 || status !== "idle"}
									onCheckedChange={(checked) => field.onChange(checked === true)}
								/>
								<span className="text-body">{t("priority.label")}</span>
							</label>
							<p className="pl-8 text-meta text-muted-foreground">
								{credits > 0 ? (
									t("priority.explain", { name: recipientFirstName })
								) : (
									<>
										{t("priority.noCredits")}{" "}
										<Link
											href={`/${slug}/settings/billing`}
											className="text-seal-ink underline-offset-4 hover:underline"
										>
											{t("priority.buy")}
										</Link>
									</>
								)}
							</p>
						</div>
					)}
				/>

				{blocker ? (
					blockerView
				) : (
					<SealButton
						initials={candidateInitials}
						recipientName={recipientFirstName}
						locked={locked}
						lockMessageId={lockId}
						status={status}
						onSeal={() => void seal(false)}
						onKeepWriting={() => textareaRef.current?.focus()}
					/>
				)}

				{errorLine && (
					<p role="alert" className="text-body text-destructive">
						{errorLine}
					</p>
				)}
				{priority && credits > 0 && !blocker && (
					<p className="label-caps text-seal-ink">{t("priority.chosen")}</p>
				)}

				<p className="pencil text-body">{signerPreview}</p>
			</form>
		</section>
	);
}
