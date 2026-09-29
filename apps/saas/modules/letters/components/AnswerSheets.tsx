"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Textarea } from "@repo/ui";
import { ResponsiveSheet } from "@shared/components/ResponsiveSheet";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

/**
 * "Say yes to Arjun? Both seals break, and your sealed section opens to him: photos, full name,
 * workplace and contact." [Yes, break the seals] [Not yet].
 */
export function SayYesSheet({
	open,
	onOpenChange,
	name,
	onConfirm,
	pending,
	error,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	name: string;
	onConfirm: () => void;
	pending: boolean;
	error: string | null;
}) {
	const t = useTranslations("letters.yes");
	const confirmRef = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (open) {
			const timer = window.setTimeout(() => confirmRef.current?.focus(), 50);
			return () => window.clearTimeout(timer);
		}
		return undefined;
	}, [open]);
	return (
		<ResponsiveSheet open={open} onOpenChange={onOpenChange} title={t("title", { name })}>
			<div className="gap-5 flex flex-col">
				<p className="text-body">{t("body", { name })}</p>
				{error && (
					<p role="alert" className="text-body text-destructive">
						{error}
					</p>
				)}
				<div className="gap-2 sm:flex-row flex flex-col">
					<Button
						ref={confirmRef}
						variant="primary"
						onClick={onConfirm}
						loading={pending}
					>
						{t("confirm")}
					</Button>
					<Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
						{t("notYet")}
					</Button>
				</div>
			</div>
		</ResponsiveSheet>
	);
}

const declineSchema = z.object({ note: z.string().trim().max(400) });

/**
 * Decline kindly (design.md §5.5): a pre-written note she can edit, or "Let it close quietly".
 * Both are final, and nothing is red.
 */
export function DeclineSheet({
	open,
	onOpenChange,
	name,
	onKindNote,
	onQuiet,
	pending,
	error,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	name: string;
	onKindNote: (note: string) => void;
	onQuiet: () => void;
	pending: boolean;
	error: string | null;
}) {
	const t = useTranslations("letters.decline");
	const form = useForm<z.infer<typeof declineSchema>>({
		resolver: zodResolver(declineSchema),
		defaultValues: { note: t("defaultNote") },
	});

	return (
		<ResponsiveSheet
			open={open}
			onOpenChange={onOpenChange}
			title={t("title", { name })}
			description={t("description", { name })}
		>
			<form
				onSubmit={form.handleSubmit(({ note }) => onKindNote(note))}
				className="gap-4 flex flex-col"
				noValidate
			>
				<label className="gap-1.5 flex flex-col">
					<span className="label-caps text-muted-foreground">{t("noteLabel")}</span>
					<Textarea
						{...form.register("note")}
						rows={4}
						maxLength={400}
						className="font-display text-letter"
					/>
				</label>
				{error && (
					<p role="alert" className="text-body text-destructive">
						{error}
					</p>
				)}
				<div className="gap-2 sm:flex-row flex flex-col">
					<Button type="submit" variant="secondary" loading={pending}>
						{t("send")}
					</Button>
					<Button type="button" variant="ghost" onClick={onQuiet} disabled={pending}>
						{t("quiet")}
					</Button>
				</div>
				<p className="text-meta text-muted-foreground">{t("final", { name })}</p>
			</form>
		</ResponsiveSheet>
	);
}
