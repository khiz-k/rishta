"use client";

import { BiodataPage } from "@biodata/components/BiodataPage";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Textarea } from "@repo/ui";
import { PaperSlip } from "@shared/components/PaperSlip";
import { ResponsiveSheet } from "@shared/components/ResponsiveSheet";
import { useRouter } from "@shared/hooks/router";
import { useErrorText } from "@shared/hooks/use-error-text";
import type { ClaimView } from "@shared/lib/api-types";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const declineSchema = z.object({ note: z.string().trim().max(400) });

/**
 * Claim your page (design.md §5.11): the draft a relative wrote, read-only. "Nothing about you is
 * visible to anyone until you confirm it." Confirming makes the candidate the owner (the one who
 * holds the seal) and the drafter a guardian; declining deletes the draft and tells them kindly.
 */
export function ClaimPage({ claim, slug }: { claim: ClaimView; slug: string }) {
	const t = useTranslations("claim");
	const errorText = useErrorText();
	const router = useRouter();
	const [declineOpen, setDeclineOpen] = useState(false);
	const confirm = useMutation(orpc.households.claim.mutationOptions());
	const decline = useMutation(orpc.households.declineClaim.mutationOptions());
	const drafter = claim.drafters[0];
	const drafterName = drafter
		? drafter.label
			? `${drafter.label}, ${drafter.name.split(" ")[0]}`
			: drafter.name.split(" ")[0]
		: null;

	const form = useForm<z.infer<typeof declineSchema>>({
		resolver: zodResolver(declineSchema),
		defaultValues: { note: "" },
	});

	const onConfirm = async (thenEdit: boolean) => {
		try {
			await confirm.mutateAsync({ organizationId: claim.organizationId });
			router.push(thenEdit ? `/${slug}/biodata` : `/${slug}/begin`);
			router.refresh();
		} catch {
			// The error line below explains it.
		}
	};

	const onDecline = form.handleSubmit(async ({ note }) => {
		try {
			await decline.mutateAsync({
				organizationId: claim.organizationId,
				note: note.length > 0 ? note : undefined,
			});
			window.location.href = "/";
		} catch {
			form.setError("root", { message: t("declineFailed") });
		}
	});

	return (
		<div className="md:px-6 pt-3 md:pt-10 mx-auto max-w-[1440px]">
			<div className="px-4 md:px-0 mx-auto max-w-(--page-width)">
				<h1 className="font-display text-title-sm">
					{drafterName ? t("title", { drafter: drafterName }) : t("titleNoDrafter")}
				</h1>
				<p className="mt-2 text-body text-muted-foreground">{t("lead")}</p>
			</div>

			<div className="mt-6">
				<BiodataPage page={claim.page} className="max-md:border-x-0" />
			</div>

			<div className="px-4 md:px-0 mt-8 mx-auto max-w-(--page-width)">
				{confirm.error && (
					<PaperSlip
						role="alert"
						tone="caution"
						title={errorText(confirm.error)}
						className="mb-5"
					/>
				)}
				<div className="gap-3 sm:flex-row flex flex-col">
					<Button
						variant="primary"
						size="lg"
						loading={confirm.isPending}
						onClick={() => void onConfirm(false)}
					>
						{t("confirm")}
					</Button>
					<Button
						variant="outline"
						size="lg"
						disabled={confirm.isPending}
						onClick={() => void onConfirm(true)}
					>
						{t("confirmAndEdit")}
					</Button>
				</div>
				<p className="mt-3 text-meta text-muted-foreground">
					{t("afterConfirm", { drafter: drafterName ?? t("yourFamily") })}
				</p>
				<button
					type="button"
					onClick={() => setDeclineOpen(true)}
					className="mt-6 min-h-11 text-ui text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
				>
					{t("notForMe")}
				</button>
			</div>

			<ResponsiveSheet
				open={declineOpen}
				onOpenChange={setDeclineOpen}
				title={t("declineTitle")}
				description={t("declineDescription", { drafter: drafterName ?? t("yourFamily") })}
			>
				<form onSubmit={onDecline} className="gap-4 flex flex-col" noValidate>
					<label className="gap-1.5 flex flex-col">
						<span className="label-caps text-muted-foreground">{t("declineNote")}</span>
						<Textarea
							{...form.register("note")}
							rows={3}
							maxLength={400}
							className="font-display text-letter"
							placeholder={t("declinePlaceholder")}
						/>
					</label>
					{form.formState.errors.root && (
						<p role="alert" className="text-body text-destructive">
							{form.formState.errors.root.message}
						</p>
					)}
					<div className="gap-2 sm:flex-row flex flex-col">
						<Button
							type="submit"
							variant="secondary"
							loading={form.formState.isSubmitting}
						>
							{t("declineSubmit")}
						</Button>
						<Button type="button" variant="ghost" onClick={() => setDeclineOpen(false)}>
							{t("keepThinking")}
						</Button>
					</div>
				</form>
			</ResponsiveSheet>
		</div>
	);
}
