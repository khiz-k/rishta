"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, cn, PencilMark, Textarea } from "@repo/ui";
import type { MarginNote } from "@shared/lib/api-types";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { useHousehold } from "./HouseholdProvider";

export type FamilyReaction = NonNullable<MarginNote["reaction"]>;
export const FAMILY_REACTIONS: FamilyReaction[] = ["proceed", "lets_talk", "not_for_us"];

/**
 * Pencil notes in a page's margin (design.md §6.5): family reactions signed with their relation
 * label ("Ammi (via link)"), in Tiro italic --pencil with a pencil mark and always the words.
 */
export function PencilNote({
	note,
	onRemove,
	removing,
}: {
	note: MarginNote;
	onRemove?: () => void;
	removing?: boolean;
}) {
	const t = useTranslations("household.pencil");
	return (
		<li
			className={cn(
				"py-2 group relative border-b border-border/70 last:border-b-0",
				onRemove && "pr-11 md:pr-9",
			)}
		>
			<p className="text-meta text-muted-foreground">
				{note.via === "link"
					? t("signedViaLink", { name: note.authorLabel })
					: t("signed", { name: note.authorLabel })}
			</p>
			<div className="mt-0.5 pencil text-letter">
				{note.reaction && (
					<span className="gap-1.5 inline-flex items-center not-italic">
						<PencilMark kind={note.reaction} />
						<span className="pencil">{t(`reaction.${note.reaction}`)}.</span>
					</span>
				)}
				{note.text && <span> “{note.text}”</span>}
			</div>
			{onRemove && (
				<button
					type="button"
					onClick={onRemove}
					disabled={removing}
					className="top-0 right-0 size-11 md:top-1 md:size-9 max-md:opacity-100 absolute inline-flex items-center justify-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
					aria-label={t("remove")}
				>
					<XIcon className="size-4" />
				</button>
			)}
		</li>
	);
}

export function PencilNotesList({
	notes,
	onChanged,
	className,
}: {
	notes: MarginNote[];
	onChanged?: () => void;
	className?: string;
}) {
	const t = useTranslations("household.pencil");
	const { abilities } = useHousehold();
	const remove = useMutation({
		...orpc.margin.remove.mutationOptions(),
		onSuccess: () => onChanged?.(),
	});

	if (notes.length === 0) {
		return <p className={cn("pencil text-body", className)}>{t("empty")}</p>;
	}

	return (
		<ul className={className}>
			{notes.map((note) => (
				<PencilNote
					key={note.id}
					note={note}
					removing={remove.isPending && remove.variables?.noteId === note.id}
					onRemove={
						note.isMine || abilities.canManage
							? () => remove.mutate({ noteId: note.id })
							: undefined
					}
				/>
			))}
		</ul>
	);
}

const pencilSchema = z
	.object({
		reaction: z.enum(["proceed", "lets_talk", "not_for_us"]).optional(),
		text: z.string().trim().max(280).optional(),
	})
	.refine((value) => Boolean(value.reaction || value.text), { path: ["text"] });

type PencilValues = z.infer<typeof pencilSchema>;

/** Three square reactions plus a few words; in the app, signed with your relation label. */
export function PencilNoteForm({
	handle,
	onAdded,
	compact,
}: {
	handle: string;
	onAdded?: () => void;
	compact?: boolean;
}) {
	const t = useTranslations("household.pencil");
	const { organizationId, abilities } = useHousehold();
	const form = useForm<PencilValues>({
		resolver: zodResolver(pencilSchema),
		defaultValues: { reaction: undefined, text: "" },
	});
	const reaction = useWatch({ control: form.control, name: "reaction" });
	const add = useMutation(orpc.margin.add.mutationOptions());

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			await add.mutateAsync({
				organizationId,
				handle,
				reaction: values.reaction,
				text: values.text && values.text.length > 0 ? values.text : undefined,
			});
			form.reset({ reaction: undefined, text: "" });
			onAdded?.();
		} catch {
			form.setError("root", { message: t("notSaved") });
		}
	});

	return (
		<form onSubmit={onSubmit} className="gap-3 flex flex-col" noValidate>
			<fieldset>
				<legend className="mb-2 label-caps text-muted-foreground">{t("prompt")}</legend>
				<div
					className={cn(
						"gap-2 grid",
						compact ? "grid-cols-1" : "max-sm:grid-cols-1 grid-cols-3",
					)}
				>
					{FAMILY_REACTIONS.map((value) => {
						const selected = reaction === value;
						return (
							<button
								key={value}
								type="button"
								aria-pressed={selected}
								onClick={() =>
									form.setValue("reaction", selected ? undefined : value, {
										shouldDirty: true,
									})
								}
								className={cn(
									"gap-2 min-h-11 px-3 font-semibold flex items-center border text-ui [font-stretch:87.5%] transition-colors focus-visible:outline-2 focus-visible:outline-ring",
									selected
										? "border-foreground bg-secondary text-secondary-foreground"
										: "border-foreground/70 bg-card text-foreground hover:bg-accent",
								)}
							>
								<PencilMark
									kind={value}
									className={selected ? "text-secondary-foreground" : undefined}
								/>
								{t(`reaction.${value}`)}
							</button>
						);
					})}
				</div>
			</fieldset>
			<label className="gap-1 flex flex-col">
				<span className="label-caps text-muted-foreground">{t("wordsLabel")}</span>
				<Textarea
					{...form.register("text")}
					rows={2}
					maxLength={280}
					placeholder={t("wordsPlaceholder")}
					className="min-h-[4.5rem] font-display text-letter italic"
				/>
			</label>
			{abilities.isCandidate && (
				// The candidate's own notes are private notes to self (spec.md §13); the server
				// never sends them to anyone else in the household.
				<p className="text-meta text-muted-foreground">{t("privateToYou")}</p>
			)}
			{form.formState.errors.root && (
				<p role="alert" className="text-meta text-destructive">
					{form.formState.errors.root.message}
				</p>
			)}
			{form.formState.errors.text && !form.formState.errors.root && (
				<p role="alert" className="text-meta text-muted-foreground">
					{t("chooseOrWrite")}
				</p>
			)}
			<div>
				<Button
					type="submit"
					variant="outline"
					size="sm"
					loading={form.formState.isSubmitting}
				>
					{t("submit")}
				</Button>
			</div>
		</form>
	);
}
