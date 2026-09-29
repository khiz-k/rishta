"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHousehold } from "@household/components/HouseholdProvider";
import { Button, cn } from "@repo/ui";
import { useShellContextLine } from "@shared/components/shell/ShellContext";
import { useRouter } from "@shared/hooks/router";
import type { Preference } from "@shared/lib/api-types";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { parseAsInteger, useQueryState } from "nuqs";
import { useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import {
	lookingForSchema,
	type LookingForValues,
	toLookingForValues,
	toUpsertInput,
} from "../../lib/looking-for";
import {
	AgeCommunityQuestion,
	FaithDietQuestion,
	TimelineQuestion,
	ValuesQuestion,
	WhereQuestion,
} from "./LookingForQuestions";

const STEPS = ["timeline", "where", "ageCommunity", "faithDiet", "values"] as const;

/**
 * The first page (design.md §5.8): the five existing quiz steps, kept in their order and typeset
 * as a letter. Timeline first; square option rows; the 12-point budget with its hard cap. Each
 * step turns like a page (180ms) and is saved as you go.
 */
export function BeginFlow({
	preference,
	fallbackSeeking,
}: {
	preference: Preference | null;
	fallbackSeeking: LookingForValues["seeking"];
}) {
	const t = useTranslations("begin");
	const { organizationId, slug, abilities, candidateFirstName } = useHousehold();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [stepParam, setStepParam] = useQueryState(
		"step",
		parseAsInteger.withDefault(1).withOptions({ history: "push", scroll: true }),
	);
	const step = Math.min(STEPS.length, Math.max(1, stepParam));
	const [direction, setDirection] = useState<"next" | "prev">("next");
	const [finished, setFinished] = useState(false);
	const headingRef = useRef<HTMLHeadingElement>(null);
	const upsert = useMutation(orpc.preferences.upsert.mutationOptions());

	const form = useForm<LookingForValues>({
		resolver: zodResolver(lookingForSchema),
		defaultValues: toLookingForValues(preference, fallbackSeeking),
		mode: "onChange",
	});
	const timeline = useWatch({ control: form.control, name: "marriageTimeline" });
	const drafting = !abilities.isCandidate;

	useShellContextLine(t("contextLine", { step, total: STEPS.length }));

	const go = (next: number) => {
		setDirection(next > step ? "next" : "prev");
		void setStepParam(next);
		window.setTimeout(() => headingRef.current?.focus(), 0);
	};

	const save = async (complete: boolean) => {
		form.clearErrors("root");
		const values = form.getValues();
		try {
			await upsert.mutateAsync(toUpsertInput(organizationId, values, complete));
			void queryClient.invalidateQueries({ queryKey: orpc.preferences.key() });
			void queryClient.invalidateQueries({ queryKey: orpc.households.get.key() });
			return true;
		} catch {
			form.setError("root", { message: t("notSaved") });
			return false;
		}
	};

	const onContinue = async () => {
		if (step === 1 && !timeline) {
			form.setError("marriageTimeline", { message: t("timelineRequired") });
			return;
		}
		const last = step === STEPS.length;
		if (await save(last)) {
			if (last) {
				setFinished(true);
			} else {
				go(step + 1);
			}
		}
	};

	if (finished) {
		return (
			<div className="px-3 md:px-6 pt-4 md:pt-12 mx-auto max-w-(--page-width)">
				<div className="animate-turn-next max-md:border-x-0 border border-border bg-card">
					<div aria-hidden="true" className="double-rule" />
					<div className="py-10 page-pad">
						<h1 className="font-display text-title">{t("done.title")}</h1>
						<p className="mt-3 text-body text-muted-foreground">
							{drafting
								? t("done.bodyDrafting", { name: candidateFirstName })
								: t("done.body")}
						</p>
						<Button
							className="mt-6"
							variant="primary"
							size="lg"
							onClick={() => router.push(`/${slug}/biodata`)}
						>
							{drafting ? t("done.draftPage") : t("done.writePage")}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	const stepKey = STEPS[step - 1] ?? "timeline";

	return (
		<FormProvider {...form}>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					void onContinue();
				}}
				className="px-0 md:px-6 pt-3 md:pt-12 mx-auto max-w-(--page-width)"
				noValidate
			>
				<div className="max-md:border-x-0 border border-border bg-card">
					<div aria-hidden="true" className="double-rule" />
					<div className="pt-8 pb-10 page-pad">
						<h1
							ref={headingRef}
							tabIndex={-1}
							className="font-display text-title outline-none"
						>
							{drafting
								? t("titleDrafting", { name: candidateFirstName })
								: t("title")}
						</h1>
						<p className="mt-2 label-caps text-muted-foreground">
							{t("stepLine", {
								step,
								total: STEPS.length,
								name: t(`steps.${stepKey}`),
							})}
						</p>
						{drafting && (
							<p className="mt-2 text-meta text-muted-foreground">
								{t("draftingNote", { name: candidateFirstName })}
							</p>
						)}

						<div
							key={stepKey}
							className={cn(
								"mt-8",
								direction === "next" ? "animate-turn-next" : "animate-turn-prev",
							)}
						>
							{stepKey === "timeline" && <TimelineQuestion />}
							{stepKey === "where" && <WhereQuestion />}
							{stepKey === "ageCommunity" && <AgeCommunityQuestion withDealbreaker />}
							{stepKey === "faithDiet" && <FaithDietQuestion />}
							{stepKey === "values" && <ValuesQuestion />}
						</div>

						{form.formState.errors.marriageTimeline && step === 1 && (
							<p role="alert" className="mt-4 text-body text-warning">
								{t("timelineRequired")}
							</p>
						)}
						{form.formState.errors.root && (
							<p role="alert" className="mt-4 text-body text-destructive">
								{form.formState.errors.root.message}{" "}
								<button
									type="submit"
									className="text-seal-ink underline-offset-4 hover:underline"
								>
									{t("tryAgain")}
								</button>
							</p>
						)}

						<div className="mt-10 gap-3 flex items-center justify-between">
							<Button
								type="button"
								variant="ghost"
								disabled={step === 1}
								onClick={() => go(step - 1)}
							>
								{t("back")}
							</Button>
							<Button type="submit" variant="secondary" loading={upsert.isPending}>
								{step === STEPS.length ? t("finish") : t("continue")}
							</Button>
						</div>
					</div>
				</div>
			</form>
		</FormProvider>
	);
}
