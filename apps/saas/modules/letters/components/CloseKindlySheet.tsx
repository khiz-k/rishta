"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, cn, Textarea } from "@repo/ui";
import { ResponsiveSheet } from "@shared/components/ResponsiveSheet";
import { orpc } from "@shared/lib/orpc-query-utils";
import { onRovingKeyDown, rovingTabIndex } from "@shared/lib/roving";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const REASONS = ["not_a_fit", "engaged_elsewhere", "other"] as const;
type Reason = (typeof REASONS)[number];

const schema = z.object({
	reason: z.enum(REASONS),
	note: z.string().trim().min(20).max(400),
});

/**
 * Close kindly (design.md §5.6, §5.12): three editable closing notes and a preview of exactly
 * what the other person will see. Final, and written in ink, not red.
 */
export function CloseKindlySheet({
	open,
	onOpenChange,
	matchId,
	theirName,
	yourName,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	matchId: string;
	theirName: string;
	yourName: string;
}) {
	const t = useTranslations("intro.close");
	const queryClient = useQueryClient();
	const close = useMutation(orpc.matches.close.mutationOptions());
	const defaults: Record<Reason, string> = {
		not_a_fit: t("notes.not_a_fit"),
		engaged_elsewhere: t("notes.engaged_elsewhere"),
		other: t("notes.other"),
	};
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { reason: "not_a_fit", note: defaults.not_a_fit },
	});
	const reason = useWatch({ control: form.control, name: "reason" });
	const note = useWatch({ control: form.control, name: "note" });

	const onSubmit = form.handleSubmit(async (values) => {
		form.clearErrors("root");
		try {
			await close.mutateAsync({ matchId, closingNote: values.note, reason: values.reason });
			void queryClient.invalidateQueries({ queryKey: orpc.interests.key() });
			void queryClient.invalidateQueries({ queryKey: orpc.matches.key() });
			onOpenChange(false);
		} catch {
			form.setError("root", { message: t("failed") });
		}
	});

	return (
		<ResponsiveSheet
			open={open}
			onOpenChange={onOpenChange}
			title={t("title", { name: theirName })}
			description={t("description")}
		>
			<form onSubmit={onSubmit} className="gap-5 flex flex-col" noValidate>
				<fieldset>
					<legend className="mb-2 label-caps text-muted-foreground">{t("choose")}</legend>
					<div
						role="radiogroup"
						aria-label={t("choose")}
						onKeyDown={(event) => onRovingKeyDown(event)}
						className="flex flex-col border border-border"
					>
						{REASONS.map((value, index) => (
							<button
								key={value}
								type="button"
								role="radio"
								aria-checked={reason === value}
								tabIndex={rovingTabIndex(
									reason === value,
									index,
									REASONS.some((item) => item === reason),
								)}
								onClick={() => {
									form.setValue("reason", value);
									form.setValue("note", defaults[value], {
										shouldValidate: false,
									});
								}}
								className={cn(
									"min-h-12 px-4 flex items-center justify-between border-b border-border text-left text-body last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
									reason === value ? "bg-accent" : "hover:bg-accent/60",
								)}
							>
								{t(`reasons.${value}`)}
								{reason === value && <span aria-hidden="true">✓</span>}
							</button>
						))}
					</div>
				</fieldset>
				<label className="gap-1.5 flex flex-col">
					<span className="label-caps text-muted-foreground">{t("noteLabel")}</span>
					<Textarea
						{...form.register("note")}
						rows={4}
						maxLength={400}
						className="font-display text-letter"
						aria-invalid={Boolean(form.formState.errors.note)}
					/>
					{form.formState.errors.note && (
						<span className="text-meta text-muted-foreground">{t("tooShort")}</span>
					)}
				</label>
				<div className="p-4 border border-dashed border-border bg-sealed">
					<p className="label-caps text-muted-foreground">
						{t("preview", { name: theirName })}
					</p>
					<p className="mt-2 text-body">{t("previewLine", { name: yourName })}</p>
					<p className="mt-1 font-display text-letter whitespace-pre-line">{note}</p>
				</div>
				{form.formState.errors.root && (
					<p role="alert" className="text-body text-destructive">
						{form.formState.errors.root.message}
					</p>
				)}
				<div className="gap-2 sm:flex-row flex flex-col">
					<Button type="submit" variant="secondary" loading={form.formState.isSubmitting}>
						{t("submit")}
					</Button>
					<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
						{t("notNow")}
					</Button>
				</div>
			</form>
		</ResponsiveSheet>
	);
}
