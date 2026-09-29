"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { FamilyReaction } from "@household/components/PencilNotes";
import { REPORT_CATEGORIES } from "@repo/database/drizzle/domain";
// Deep imports: the family link's budget (design.md §5.9) can't carry the whole UI barrel.
import { Button } from "@repo/ui/components/button";
import { PencilMark } from "@repo/ui/components/rishta/pencil-mark";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib";
import { useReducedMotion } from "@shared/hooks/use-reduced-motion";
import { orpc } from "@shared/lib/orpc-query-utils";
import { onRovingKeyDown, rovingTabIndex } from "@shared/lib/roving";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const REACTIONS: FamilyReaction[] = ["proceed", "lets_talk", "not_for_us"];

const wordsSchema = z.object({
	reaction: z.enum(["proceed", "lets_talk", "not_for_us"]).nullable(),
	text: z.string().trim().max(280),
});

const reportSchema = z.object({
	category: z.enum(REPORT_CATEGORIES),
	details: z.string().trim().max(2000),
});

/**
 * Proceed · Let's talk · Not for us (design.md §5.9): three square 56px buttons. A tap is saved
 * at once and can be changed until the link closes; a few words are optional. Only the
 * candidate can ever say yes: a reaction never changes a letter.
 */
export function FamilyReactions({
	token,
	sharedBy,
	initialReaction,
	initialText,
	englishReactions,
}: {
	token: string;
	sharedBy: string;
	initialReaction: FamilyReaction | null;
	initialText: string | null;
	/** Shown beside the translated word ("Proceed · आगे बढ़ें") when the link isn't in English. */
	englishReactions: Record<FamilyReaction, string> | null;
}) {
	const t = useTranslations("family.link");
	const tReactions = useTranslations("family.link.reactions");
	const react = useMutation(orpc.familyLinks.react.mutationOptions());
	const reportMutation = useMutation(orpc.familyLinks.report.mutationOptions());
	const [savedReaction, setSavedReaction] = useState<FamilyReaction | null>(initialReaction);
	const [wordsSent, setWordsSent] = useState(false);
	const [reporting, setReporting] = useState(false);
	const [failed, setFailed] = useState(false);

	const form = useForm<z.infer<typeof wordsSchema>>({
		resolver: zodResolver(wordsSchema),
		defaultValues: { reaction: initialReaction, text: initialText ?? "" },
	});
	const reaction = useWatch({ control: form.control, name: "reaction" });
	const reportForm = useForm<z.infer<typeof reportSchema>>({
		resolver: zodResolver(reportSchema),
		defaultValues: { category: "scam_money", details: "" },
	});
	const category = useWatch({ control: reportForm.control, name: "category" });

	const choose = async (value: FamilyReaction) => {
		setFailed(false);
		form.setValue("reaction", value);
		try {
			await react.mutateAsync({ token, reaction: value });
			setSavedReaction(value);
		} catch {
			setFailed(true);
			form.setValue("reaction", savedReaction);
		}
	};

	const sendWords = form.handleSubmit(async (values) => {
		setFailed(false);
		if (!values.text && !values.reaction) {
			return;
		}
		try {
			await react.mutateAsync({
				token,
				reaction: values.reaction ?? undefined,
				text: values.text.length > 0 ? values.text : undefined,
			});
			setWordsSent(true);
		} catch {
			setFailed(true);
		}
	});

	const label = (value: FamilyReaction) =>
		englishReactions ? `${englishReactions[value]} · ${tReactions(value)}` : tReactions(value);

	/**
	 * The answers sit after the whole page, so on the phone a thumb-zone bar ("What do you
	 * think? ↓") stays at the bottom edge until they come into view (quality rule A3). It only
	 * scrolls: nothing is answered from it.
	 */
	const sectionRef = useRef<HTMLElement>(null);
	const reducedMotion = useReducedMotion();
	const [answersInView, setAnswersInView] = useState(true);
	useEffect(() => {
		const section = sectionRef.current;
		if (!section || typeof IntersectionObserver === "undefined") {
			return;
		}
		const observer = new IntersectionObserver(([entry]) => {
			setAnswersInView(entry?.isIntersecting ?? true);
		});
		observer.observe(section);
		return () => observer.disconnect();
	}, []);
	const goToAnswers = () => {
		const section = sectionRef.current;
		section?.querySelector<HTMLButtonElement>("[aria-pressed]")?.focus({ preventScroll: true });
		section?.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
	};

	return (
		<section ref={sectionRef} aria-labelledby="family-question" className="mt-10">
			{!answersInView && (
				<div className="md:hidden inset-x-0 bottom-0 fixed z-30 border-t border-border bg-background pb-safe">
					<button
						type="button"
						onClick={goToAnswers}
						className="min-h-14 px-4 gap-3 flex w-full items-center justify-between text-left text-family-button focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
					>
						<span className="min-w-0">{t("question")}</span>
						<span aria-hidden="true">↓</span>
					</button>
				</div>
			)}
			<h2 id="family-question" className="font-display text-title-sm">
				{t("question")}
			</h2>
			{/* A tap is saved at once, so these are pressed buttons rather than radios: nothing is
			    sent by an arrow key. */}
			<div role="group" aria-labelledby="family-question" className="mt-4 flex flex-col">
				{REACTIONS.map((value, index) => {
					const selected = reaction === value;
					return (
						<button
							key={value}
							type="button"
							aria-pressed={selected}
							// aria-disabled, not disabled: the tapped button keeps focus while it saves.
							aria-disabled={react.isPending || undefined}
							onClick={() => {
								if (!react.isPending) {
									void choose(value);
								}
							}}
							className={cn(
								"min-h-14 px-5 gap-3 flex items-center border border-foreground text-left text-family-button transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
								index > 0 && "-mt-px",
								selected
									? "bg-secondary text-secondary-foreground"
									: "bg-card text-foreground hover:bg-accent",
							)}
						>
							<PencilMark
								kind={value}
								className={cn("size-5", selected && "text-secondary-foreground")}
							/>
							<span className="flex-1">{label(value)}</span>
							{selected && <span aria-hidden="true">✓</span>}
						</button>
					);
				})}
			</div>

			<p role="status" aria-live="polite" className="mt-3 text-family-value">
				{savedReaction && (
					<span className="font-display">
						{t("thanks", { name: sharedBy, reaction: tReactions(savedReaction) })}{" "}
						<span className="text-body text-muted-foreground">{t("canChange")}</span>
					</span>
				)}
			</p>
			{failed && (
				<p role="alert" className="mt-2 text-body text-destructive">
					{t("notSaved")}
				</p>
			)}

			<form onSubmit={sendWords} className="mt-6 gap-3 flex flex-col" noValidate>
				<label className="gap-2 flex flex-col">
					<span className="text-family-value">{t("words")}</span>
					<Textarea
						{...form.register("text")}
						rows={3}
						maxLength={280}
						className="font-display text-family-value"
					/>
				</label>
				<div className="gap-3 flex flex-wrap items-center">
					<Button type="submit" variant="secondary" size="lg" loading={react.isPending}>
						{t("send", { name: sharedBy })}
					</Button>
					{wordsSent && (
						<span className="pencil text-body">{t("sent", { name: sharedBy })}</span>
					)}
				</div>
			</form>

			<div className="mt-10 pt-4 border-t border-border">
				{!reporting ? (
					<button
						type="button"
						onClick={() => setReporting(true)}
						className="min-h-11 text-body text-muted-foreground underline-offset-4 hover:underline"
					>
						{t("report")}
					</button>
				) : reportMutation.isSuccess ? (
					<p className="text-body">{t("reportThanks")}</p>
				) : (
					<form
						onSubmit={reportForm.handleSubmit(async (values) => {
							await reportMutation.mutateAsync({
								token,
								category: values.category,
								details: values.details.length > 0 ? values.details : undefined,
							});
						})}
						className="gap-3 flex flex-col"
						noValidate
					>
						<p id="family-report-title" className="font-display text-section">
							{t("reportTitle")}
						</p>
						<div
							role="radiogroup"
							aria-labelledby="family-report-title"
							onKeyDown={(event) => onRovingKeyDown(event)}
							className="flex flex-col border border-border"
						>
							{REPORT_CATEGORIES.map((value, index) => (
								<button
									key={value}
									type="button"
									role="radio"
									aria-checked={category === value}
									tabIndex={rovingTabIndex(category === value, index, true)}
									onClick={() => reportForm.setValue("category", value)}
									className={cn(
										"min-h-12 px-4 flex items-center justify-between border-b border-border text-left text-body last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
										category === value ? "bg-accent" : "hover:bg-accent/60",
									)}
								>
									{t(`reportCategories.${value}`)}
									{category === value && <span aria-hidden="true">✓</span>}
								</button>
							))}
						</div>
						<Textarea {...reportForm.register("details")} rows={3} maxLength={2000} />
						<div>
							<Button
								type="submit"
								variant="secondary"
								loading={reportMutation.isPending}
							>
								{t("reportSubmit")}
							</Button>
						</div>
					</form>
				)}
			</div>
		</section>
	);
}
