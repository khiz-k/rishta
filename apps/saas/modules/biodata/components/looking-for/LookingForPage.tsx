"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHousehold } from "@household/components/HouseholdProvider";
import { Button } from "@repo/ui";
import { useShellContextLine } from "@shared/components/shell/ShellContext";
import type { Preference } from "@shared/lib/api-types";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import {
	lookingForSchema,
	type LookingForValues,
	toLookingForValues,
	toUpsertInput,
} from "../../lib/looking-for";
import {
	AgeCommunityQuestion,
	FaithDietQuestion,
	LanguagesQuestion,
	TimelineQuestion,
	ValuesQuestion,
	WhereQuestion,
} from "./LookingForQuestions";

const SAVE_DELAY_MS = 700;

/**
 * Looking for (design.md §5.8): your non-negotiables as one editable page. Every change saves in
 * place; each row carries Dealbreaker · Nice to have. Changes shape tomorrow's folio, not today's.
 */
export function LookingForPage({
	preference,
	fallbackSeeking,
}: {
	preference: Preference | null;
	fallbackSeeking: LookingForValues["seeking"];
}) {
	const t = useTranslations("lookingFor");
	const { organizationId, slug, household, candidateFirstName } = useHousehold();
	const queryClient = useQueryClient();
	const upsert = useMutation(orpc.preferences.upsert.mutationOptions());
	const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
	const timer = useRef<number | null>(null);
	const canEdit =
		household.role === "owner" || (household.role === "admin" && !household.candidate.userId);
	const complete = Boolean(preference?.completedAt);

	useShellContextLine(t("title"));

	const form = useForm<LookingForValues>({
		resolver: zodResolver(lookingForSchema),
		defaultValues: toLookingForValues(preference, fallbackSeeking),
	});

	const saveNow = async () => {
		const valid = await form.trigger();
		if (!valid) {
			setStatus("error");
			return;
		}
		setStatus("saving");
		try {
			const values = form.getValues();
			await upsert.mutateAsync(
				toUpsertInput(organizationId, values, complete && Boolean(values.marriageTimeline)),
			);
			setStatus("saved");
			void queryClient.invalidateQueries({ queryKey: orpc.preferences.key() });
		} catch {
			setStatus("error");
		}
	};

	useEffect(() => {
		if (!canEdit) {
			return;
		}
		const subscription = form.watch((_, info) => {
			if (!info.name) {
				return;
			}
			if (timer.current) {
				window.clearTimeout(timer.current);
			}
			setStatus("saving");
			timer.current = window.setTimeout(() => void saveNow(), SAVE_DELAY_MS);
		});
		return () => {
			subscription.unsubscribe();
			if (timer.current) {
				window.clearTimeout(timer.current);
			}
		};
	}, [form, canEdit]); // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps

	return (
		<FormProvider {...form}>
			<div className="md:px-6 lg:px-10 pt-3 md:pt-8 lg:grid lg:grid-cols-[minmax(0,var(--page-width))_280px] lg:justify-center lg:gap-10 mx-auto max-w-[1440px]">
				<form
					onSubmit={(event) => {
						event.preventDefault();
						void saveNow();
					}}
					noValidate
					className="min-w-0"
				>
					<fieldset
						disabled={!canEdit}
						className="max-md:border-x-0 border border-border bg-card"
					>
						<div aria-hidden="true" className="double-rule" />
						<div className="pt-6 pb-10 page-pad">
							<h1 className="font-display text-title">{t("title")}</h1>
							<p className="mt-2 text-body text-muted-foreground">
								{canEdit ? t("lead") : t("readOnly", { name: candidateFirstName })}
							</p>
							<div className="mt-8">
								<TimelineQuestion withDealbreaker />
								<WhereQuestion withDealbreaker />
								<AgeCommunityQuestion withDealbreaker />
								<FaithDietQuestion />
								<LanguagesQuestion />
								<ValuesQuestion />
							</div>
						</div>
					</fieldset>
				</form>

				<aside className="max-lg:px-4 max-lg:mt-6 lg:sticky lg:top-[calc(var(--masthead-height)+2rem)] self-start">
					<p className="pencil text-body">{t("margin")}</p>
					<p role="status" aria-live="polite" className="mt-4 text-meta">
						{status === "saving" && (
							<span className="text-muted-foreground">{t("saving")}</span>
						)}
						{status === "saved" && <span className="pencil">{t("saved")}</span>}
						{status === "error" && (
							<span className="text-destructive">
								{t("notSaved")}{" "}
								<Button variant="link" size="sm" onClick={() => void saveNow()}>
									{t("tryAgain")}
								</Button>
							</span>
						)}
					</p>
					<Link
						href={`/${slug}/biodata`}
						className="mt-6 min-h-11 inline-flex items-center text-ui text-seal-ink underline-offset-4 hover:underline"
					>
						← {t("backToPage")}
					</Link>
				</aside>
			</div>
		</FormProvider>
	);
}
