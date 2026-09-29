"use client";

import { OptionRows } from "@biodata/components/looking-for/controls";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Textarea,
} from "@repo/ui";
import { useShellContextLine } from "@shared/components/shell/ShellContext";
import { useRouter } from "@shared/hooks/router";
import { useErrorText } from "@shared/hooks/use-error-text";
import type { ClosePreview } from "@shared/lib/api-types";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { useHousehold } from "./HouseholdProvider";

const REASONS = ["engaged", "break", "other"] as const;

const schema = z.object({
	reason: z.enum(REASONS).nullable(),
	closingNote: z.string().trim().min(20).max(400),
});
type Values = z.infer<typeof schema>;

const storySchema = z.object({ story: z.string().trim().max(2000) });

/**
 * Close my search (design.md §5.12): engaged, taking a break, or something else, with an honest
 * list of what happens next. Engaged or something else closes the page kindly in one step:
 * waiting letters get a kind answer, sealed notes are taken back, introductions receive your
 * closing note, family links close. A break only pauses the page.
 */
export function CloseSearch({ preview }: { preview: ClosePreview }) {
	const t = useTranslations("close");
	const errorText = useErrorText();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { organizationId, slug, household } = useHousehold();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [result, setResult] = useState<"engaged" | "break" | "other" | null>(null);
	const close = useMutation(orpc.households.closeSearch.mutationOptions());
	const remove = useMutation(orpc.households.delete.mutationOptions());
	const saveStory = useMutation(orpc.households.setClosingStory.mutationOptions());

	useShellContextLine(t("title"));

	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { reason: null, closingNote: preview.defaultClosingNote },
	});
	const reason = useWatch({ control: form.control, name: "reason" });
	const storyForm = useForm<z.infer<typeof storySchema>>({
		resolver: zodResolver(storySchema),
		defaultValues: { story: "" },
	});

	const refresh = () => {
		void queryClient.invalidateQueries({ queryKey: orpc.households.key() });
		void queryClient.invalidateQueries({ queryKey: orpc.folio.key() });
		void queryClient.invalidateQueries({ queryKey: orpc.interests.key() });
		void queryClient.invalidateQueries({ queryKey: orpc.profiles.me.key() });
	};

	const onClose = async () => {
		const values = form.getValues();
		if (!values.reason) {
			return;
		}
		try {
			await close.mutateAsync({
				organizationId,
				reason: values.reason,
				closingNote: values.reason === "break" ? undefined : values.closingNote,
			});
			setConfirmOpen(false);
			setResult(values.reason);
			refresh();
		} catch {
			setConfirmOpen(false);
		}
	};

	const onDelete = async () => {
		try {
			await remove.mutateAsync({ organizationId });
			window.location.href = "/settings/general?deleted=household";
		} catch {
			setDeleteOpen(false);
		}
	};

	if (result) {
		return (
			<div className="px-4 md:px-6 pt-6 md:pt-14 mx-auto max-w-(--page-width)">
				<div className="border border-border bg-card">
					<div aria-hidden="true" className="double-rule" />
					<div className="py-10 page-pad">
						<h1 className="font-display text-title-sm">{t(`done.${result}.title`)}</h1>
						<p className="mt-3 text-body text-muted-foreground">
							{t(`done.${result}.body`)}
						</p>
						{result === "engaged" && (
							<form
								className="mt-8 gap-3 flex flex-col"
								onSubmit={storyForm.handleSubmit(async ({ story }) => {
									await saveStory.mutateAsync({
										organizationId,
										story: story.length > 0 ? story : null,
									});
								})}
								noValidate
							>
								<label className="gap-1.5 flex flex-col">
									<span className="font-display text-section">
										{t("story.question")}
									</span>
									<span className="text-meta text-muted-foreground">
										{t("story.hint")}
									</span>
									<Textarea
										{...storyForm.register("story")}
										rows={4}
										maxLength={2000}
										className="font-display text-letter"
									/>
								</label>
								<div className="gap-3 flex items-center">
									<Button
										type="submit"
										variant="outline"
										loading={saveStory.isPending}
									>
										{t("story.save")}
									</Button>
									{saveStory.isSuccess && (
										<span className="pencil text-meta">
											{t("story.thanks")}
										</span>
									)}
								</div>
								<p className="mt-6 text-body">{t("referral")}</p>
							</form>
						)}
						{result === "break" && (
							<Button
								className="mt-6"
								variant="secondary"
								onClick={() => router.push(`/${slug}/biodata`)}
							>
								{t("done.break.openPage")}
							</Button>
						)}
					</div>
				</div>
			</div>
		);
	}

	const lines = [
		t("next.hidden"),
		...(reason === "break"
			? [t("next.breakLetters")]
			: [
					preview.waitingLetters > 0
						? t("next.waiting", { count: preview.waitingLetters })
						: null,
					preview.sealedNotes > 0
						? t("next.sealed", { count: preview.sealedNotes })
						: null,
					preview.openIntroductions > 0
						? t("next.introductions", { count: preview.openIntroductions })
						: null,
					t("next.links"),
				]),
	].filter((line): line is string => Boolean(line));

	return (
		<div className="px-0 md:px-6 pt-3 md:pt-10 mx-auto max-w-(--page-width)">
			<form
				onSubmit={(event) => {
					event.preventDefault();
					void form.trigger().then((valid) => {
						if (valid && form.getValues("reason")) {
							setConfirmOpen(true);
						}
					});
				}}
				className="max-md:border-x-0 border border-border bg-card"
				noValidate
			>
				<div aria-hidden="true" className="double-rule" />
				<div className="pt-6 pb-10 page-pad">
					<h1 className="font-display text-title">{t("title")}</h1>
					<p className="mt-2 text-body text-muted-foreground">
						{t("lead", { name: household.candidate.firstName })}
					</p>

					<fieldset className="mt-8">
						<legend className="font-display text-section">{t("why")}</legend>
						<div className="mt-4">
							<Controller
								control={form.control}
								name="reason"
								render={({ field }) => (
									<OptionRows
										options={REASONS}
										value={field.value}
										onChange={field.onChange}
										label={t("why")}
										labelFor={(value) => t(`reasons.${value}`)}
									/>
								)}
							/>
						</div>
					</fieldset>

					{reason && (
						<section aria-labelledby="close-next" className="mt-8">
							<h2
								id="close-next"
								className="hairline-after font-display text-section"
							>
								{t("next.title")}
							</h2>
							<ul className="mt-3 gap-2 flex flex-col">
								{lines.map((line) => (
									<li
										key={line}
										className="gap-2 grid grid-cols-[1rem_1fr] text-body"
									>
										<span aria-hidden="true">·</span>
										{line}
									</li>
								))}
							</ul>
							{reason !== "break" && preview.openIntroductions > 0 && (
								<label className="mt-5 gap-1.5 flex flex-col">
									<span className="label-caps text-muted-foreground">
										{t("closingNote")}
									</span>
									<Textarea
										{...form.register("closingNote")}
										rows={3}
										maxLength={400}
										className="font-display text-letter"
									/>
									{form.formState.errors.closingNote && (
										<span className="text-meta text-muted-foreground">
											{t("closingNoteShort")}
										</span>
									)}
								</label>
							)}
						</section>
					)}

					{close.error && (
						<p role="alert" className="mt-5 text-body text-destructive">
							{errorText(close.error)}
						</p>
					)}

					<div className="mt-8 gap-4 flex flex-col items-start">
						<Button type="submit" variant="secondary" disabled={!reason}>
							{reason === "break" ? t("submitBreak") : t("submit")}
						</Button>
						<button
							type="button"
							onClick={() => setDeleteOpen(true)}
							className="min-h-11 text-ui text-destructive underline-offset-4 hover:underline"
						>
							{t("deleteInstead")}
						</button>
					</div>
				</div>
			</form>

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{reason === "break" ? t("confirm.breakTitle") : t("confirm.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{reason === "break" ? t("confirm.breakBody") : t("confirm.body")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("confirm.cancel")}</AlertDialogCancel>
						<Button
							variant="secondary"
							loading={close.isPending}
							onClick={() => void onClose()}
						>
							{reason === "break" ? t("submitBreak") : t("submit")}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
						<AlertDialogDescription>{t("delete.body")}</AlertDialogDescription>
					</AlertDialogHeader>
					{remove.error && (
						<p className="text-body text-destructive">{errorText(remove.error)}</p>
					)}
					<AlertDialogFooter>
						<AlertDialogCancel>{t("delete.cancel")}</AlertDialogCancel>
						<Button
							variant="destructive"
							loading={remove.isPending}
							onClick={() => void onDelete()}
						>
							{t("delete.confirm")}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
