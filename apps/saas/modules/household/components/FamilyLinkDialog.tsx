"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PAGE_LANGUAGES } from "@repo/database/drizzle/domain";
import { FAMILY_LANGUAGE_NAMES } from "@repo/i18n/lib/family-languages";
import { Button, Checkbox, cn, Input } from "@repo/ui";
import { ResponsiveSheet } from "@shared/components/ResponsiveSheet";
import { knownErrorCode } from "@shared/lib/errors";
import { formatFullDay } from "@shared/lib/format";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { useHousehold } from "./HouseholdProvider";

const EXPIRY_DAYS = [1, 3, 7] as const;

const schema = z.object({
	recipientLabel: z.string().trim().min(1).max(40),
	language: z.enum(PAGE_LANGUAGES),
	expiresInDays: z.union([z.literal(1), z.literal(3), z.literal(7)]),
	includeNote: z.boolean(),
});
type Values = z.infer<typeof schema>;

interface CreatedLink {
	url: string;
	expiresAt: string;
	shareText: string;
	recipientLabel: string;
}

/**
 * Show my family (design.md §6.5): a private, watermarked, expiring link to one page, handed to
 * the phone's share sheet (or WhatsApp on desktop) with neutral text. Only the candidate can
 * ever say yes; a family reaction never changes a letter.
 */
export function FamilyLinkDialog({
	open,
	onOpenChange,
	handle,
	pageName,
	letterId,
	familyLinksAllowed = true,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	handle: string;
	pageName: string;
	letterId?: string;
	familyLinksAllowed?: boolean;
}) {
	const t = useTranslations("family.dialog");
	const { household, organizationId } = useHousehold();
	const locale = useLocale();
	const queryClient = useQueryClient();
	const [created, setCreated] = useState<CreatedLink | null>(null);
	const [copied, setCopied] = useState(false);

	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: {
			recipientLabel: "",
			language: household.settings.familyLanguage,
			expiresInDays: 3,
			includeNote: Boolean(letterId),
		},
	});
	const language = useWatch({ control: form.control, name: "language" });
	const expiresInDays = useWatch({ control: form.control, name: "expiresInDays" });

	const create = useMutation(orpc.familyLinks.create.mutationOptions());

	const onSubmit = form.handleSubmit(async (values) => {
		form.clearErrors("root");
		try {
			const result = await create.mutateAsync({
				organizationId,
				handle,
				recipientLabel: values.recipientLabel,
				language: values.language,
				expiresInDays: values.expiresInDays,
				letterId: letterId && values.includeNote ? letterId : undefined,
			});
			setCreated({ ...result, recipientLabel: values.recipientLabel });
			void queryClient.invalidateQueries({ queryKey: orpc.familyLinks.list.key() });
		} catch (error) {
			const code = knownErrorCode(error);
			form.setError("root", {
				message:
					code === "FAMILY_LINK_LIMIT"
						? t("limit")
						: code === "FAMILY_LINKS_NOT_ALLOWED"
							? t("notAllowed")
							: t("failed"),
			});
		}
	});

	const close = (next: boolean) => {
		onOpenChange(next);
		if (!next) {
			setCreated(null);
			setCopied(false);
			form.reset();
		}
	};

	const share = async () => {
		if (!created) {
			return;
		}
		if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
			try {
				await navigator.share({ text: created.shareText });
				return;
			} catch {
				// Cancelled: the WhatsApp and copy options stay on screen.
			}
		}
		window.open(
			`https://wa.me/?text=${encodeURIComponent(created.shareText)}`,
			"_blank",
			"noopener",
		);
	};

	const copy = async () => {
		if (!created) {
			return;
		}
		try {
			await navigator.clipboard.writeText(created.url);
			setCopied(true);
		} catch {
			setCopied(false);
		}
	};

	return (
		<ResponsiveSheet
			open={open}
			onOpenChange={close}
			title={created ? t("readyTitle", { label: created.recipientLabel }) : t("title")}
			description={created ? undefined : t("description", { name: pageName })}
		>
			{!familyLinksAllowed ? (
				<p className="text-body text-muted-foreground">{t("notAllowed")}</p>
			) : created ? (
				<div className="gap-4 flex flex-col">
					<p className="text-body">
						{t("readyBody", {
							until: formatFullDay(created.expiresAt, locale),
						})}
					</p>
					<p className="px-3 py-2 border border-dashed border-border bg-sealed text-meta break-all">
						{created.url}
					</p>
					<div className="gap-2 sm:flex-row flex flex-col">
						<Button variant="primary" onClick={() => void share()}>
							{t("share")}
						</Button>
						<Button
							variant="outline"
							onClick={() =>
								window.open(
									`https://wa.me/?text=${encodeURIComponent(created.shareText)}`,
									"_blank",
									"noopener",
								)
							}
						>
							{t("whatsapp")}
						</Button>
						<Button variant="ghost" onClick={() => void copy()}>
							{copied ? t("copied") : t("copy")}
						</Button>
					</div>
					<p className="text-meta text-muted-foreground">{t("privacy")}</p>
				</div>
			) : (
				<form onSubmit={onSubmit} className="gap-5 flex flex-col" noValidate>
					<label className="gap-1.5 flex flex-col">
						<span className="label-caps text-muted-foreground">{t("forWhom")}</span>
						<Input
							{...form.register("recipientLabel")}
							placeholder={t("forWhomPlaceholder")}
							maxLength={40}
							autoComplete="off"
							aria-invalid={Boolean(form.formState.errors.recipientLabel)}
						/>
						{form.formState.errors.recipientLabel && (
							<span className="text-meta text-destructive">
								{t("forWhomRequired")}
							</span>
						)}
					</label>

					<fieldset>
						<legend className="mb-2 label-caps text-muted-foreground">
							{t("language")}
						</legend>
						<div className="gap-2 sm:grid-cols-4 grid grid-cols-2">
							{PAGE_LANGUAGES.map((code) => (
								<button
									key={code}
									type="button"
									lang={code}
									dir={code === "ur" ? "rtl" : undefined}
									aria-pressed={language === code}
									onClick={() => form.setValue("language", code)}
									className={cn(
										"min-h-11 px-2 border text-ui transition-colors focus-visible:outline-2 focus-visible:outline-ring",
										language === code
											? "border-2 border-foreground text-foreground"
											: "border-border text-muted-foreground hover:text-foreground",
									)}
								>
									{FAMILY_LANGUAGE_NAMES[code]}
								</button>
							))}
						</div>
					</fieldset>

					<fieldset>
						<legend className="mb-2 label-caps text-muted-foreground">
							{t("openFor")}
						</legend>
						<div className="gap-2 grid grid-cols-3">
							{EXPIRY_DAYS.map((days) => (
								<button
									key={days}
									type="button"
									aria-pressed={expiresInDays === days}
									onClick={() => form.setValue("expiresInDays", days)}
									className={cn(
										"min-h-11 border text-ui tabular transition-colors focus-visible:outline-2 focus-visible:outline-ring",
										expiresInDays === days
											? "border-2 border-foreground text-foreground"
											: "border-border text-muted-foreground hover:text-foreground",
									)}
								>
									{t("days", { count: days })}
								</button>
							))}
						</div>
					</fieldset>

					{letterId && (
						<Controller
							control={form.control}
							name="includeNote"
							render={({ field }) => (
								<label className="gap-3 min-h-11 flex cursor-pointer items-center">
									<Checkbox
										checked={field.value}
										onCheckedChange={(checked) =>
											field.onChange(checked === true)
										}
									/>
									<span className="text-body">
										{t("includeNote", { name: pageName })}
									</span>
								</label>
							)}
						/>
					)}

					{form.formState.errors.root && (
						<p role="alert" className="text-body text-destructive">
							{form.formState.errors.root.message}
						</p>
					)}

					<div className="gap-3 flex flex-wrap items-center">
						<Button
							type="submit"
							variant="secondary"
							loading={form.formState.isSubmitting}
						>
							{t("create")}
						</Button>
						<p className="text-meta text-muted-foreground">{t("watermarkNote")}</p>
					</div>
				</form>
			)}
		</ResponsiveSheet>
	);
}
