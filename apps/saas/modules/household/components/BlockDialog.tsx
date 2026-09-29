"use client";

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
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useHousehold } from "./HouseholdProvider";

const schema = z.object({ reason: z.string().trim().max(400) });

/** A square confirm step (never window.confirm): blocking hides everything, both ways. */
export function BlockDialog({
	open,
	onOpenChange,
	handle,
	name,
	onBlocked,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	handle: string;
	name: string;
	onBlocked: () => void;
}) {
	const t = useTranslations("report.block");
	const { organizationId } = useHousehold();
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { reason: "" },
	});
	const block = useMutation(orpc.profiles.block.mutationOptions());

	const onSubmit = form.handleSubmit(async ({ reason }) => {
		form.clearErrors("root");
		try {
			await block.mutateAsync({
				organizationId,
				handle,
				reason: reason.length > 0 ? reason : undefined,
			});
			onOpenChange(false);
			onBlocked();
		} catch {
			form.setError("root", { message: t("failed") });
		}
	});

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<form onSubmit={onSubmit} className="gap-4 grid" noValidate>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("title", { name })}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("description", { name })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<label className="gap-1.5 flex flex-col">
						<span className="label-caps text-muted-foreground">{t("reason")}</span>
						<Textarea {...form.register("reason")} rows={2} maxLength={400} />
					</label>
					{form.formState.errors.root && (
						<p role="alert" className="text-body text-destructive">
							{form.formState.errors.root.message}
						</p>
					)}
					<AlertDialogFooter>
						<AlertDialogCancel type="button">{t("cancel")}</AlertDialogCancel>
						<Button
							type="submit"
							variant="secondary"
							loading={form.formState.isSubmitting}
						>
							{t("confirm", { name })}
						</Button>
					</AlertDialogFooter>
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
}
