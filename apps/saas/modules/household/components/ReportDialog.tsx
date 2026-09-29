"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { REPORT_CATEGORIES } from "@repo/database/drizzle/domain";
import { Button, Checkbox, cn, Textarea } from "@repo/ui";
import { ResponsiveSheet } from "@shared/components/ResponsiveSheet";
import { orpc } from "@shared/lib/orpc-query-utils";
import { onRovingKeyDown, rovingTabIndex } from "@shared/lib/roving";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { useHousehold } from "./HouseholdProvider";

const schema = z.object({
	category: z.enum(REPORT_CATEGORIES),
	details: z.string().trim().max(2000),
	alsoBlock: z.boolean(),
});
type Values = z.infer<typeof schema>;

/**
 * "Tell us what happened. We read every report, and we won't tell them you reported."
 * Filed from a page, a letter or a message. Only the candidate also blocks.
 */
export function ReportDialog({
	open,
	onOpenChange,
	context,
	contextId,
	name,
	onBlocked,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	context: "page" | "letter" | "message";
	contextId: string;
	name: string;
	onBlocked?: () => void;
}) {
	const t = useTranslations("report");
	const { organizationId, abilities } = useHousehold();
	const [done, setDone] = useState<{ blocked: boolean } | null>(null);
	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { category: "scam_money", details: "", alsoBlock: abilities.isCandidate },
	});
	const category = useWatch({ control: form.control, name: "category" });
	const report = useMutation(orpc.reports.create.mutationOptions());

	const onSubmit = form.handleSubmit(async (values) => {
		form.clearErrors("root");
		try {
			await report.mutateAsync({
				context,
				contextId,
				category: values.category,
				details: values.details.length > 0 ? values.details : undefined,
				alsoBlock: abilities.isCandidate && values.alsoBlock,
				organizationId,
			});
			setDone({ blocked: abilities.isCandidate && values.alsoBlock });
		} catch {
			form.setError("root", { message: t("failed") });
		}
	});

	const close = (next: boolean) => {
		onOpenChange(next);
		if (!next) {
			if (done?.blocked) {
				onBlocked?.();
			}
			setDone(null);
			form.reset();
		}
	};

	return (
		<ResponsiveSheet
			open={open}
			onOpenChange={close}
			title={done ? t("thanksTitle") : t("title", { name })}
			description={done ? undefined : t("description")}
		>
			{done ? (
				<div className="gap-4 flex flex-col">
					<p className="text-body">
						{done.blocked ? t("thanksBlocked", { name }) : t("thanks")}
					</p>
					<div>
						<Button variant="secondary" onClick={() => close(false)}>
							{t("done")}
						</Button>
					</div>
				</div>
			) : (
				<form onSubmit={onSubmit} className="gap-5 flex flex-col" noValidate>
					<fieldset>
						<legend className="mb-2 label-caps text-muted-foreground">
							{t("whatHappened")}
						</legend>
						<div
							role="radiogroup"
							aria-label={t("whatHappened")}
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
									onClick={() => form.setValue("category", value)}
									className={cn(
										"min-h-12 px-4 flex items-center justify-between border-b border-border text-left text-body last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
										category === value
											? "bg-accent text-foreground"
											: "hover:bg-accent/60",
									)}
								>
									{t(`categories.${value}`)}
									{category === value && <span aria-hidden="true">✓</span>}
								</button>
							))}
						</div>
					</fieldset>
					<label className="gap-1.5 flex flex-col">
						<span className="label-caps text-muted-foreground">{t("details")}</span>
						<Textarea {...form.register("details")} rows={4} maxLength={2000} />
					</label>
					{abilities.isCandidate && (
						<Controller
							control={form.control}
							name="alsoBlock"
							render={({ field }) => (
								<label className="gap-3 min-h-11 flex cursor-pointer items-center">
									<Checkbox
										checked={field.value}
										onCheckedChange={(checked) =>
											field.onChange(checked === true)
										}
									/>
									<span className="text-body">{t("alsoBlock", { name })}</span>
								</label>
							)}
						/>
					)}
					{form.formState.errors.root && (
						<p role="alert" className="text-body text-destructive">
							{form.formState.errors.root.message}
						</p>
					)}
					<div>
						<Button
							type="submit"
							variant="secondary"
							loading={form.formState.isSubmitting}
						>
							{t("submit")}
						</Button>
					</div>
				</form>
			)}
		</ResponsiveSheet>
	);
}
