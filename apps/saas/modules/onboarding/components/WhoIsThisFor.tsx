"use client";

import { useSession } from "@auth/hooks/use-session";
import { OptionRows } from "@biodata/components/looking-for/controls";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import type { CandidateRelation } from "@repo/database/drizzle/domain";
import { Button, cn, Input } from "@repo/ui";
import { useRouter } from "@shared/hooks/router";
import { useErrorText } from "@shared/hooks/use-error-text";
import { clearCache } from "@shared/lib/cache";
import { firstNameOf } from "@shared/lib/format";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const RELATIONS = ["self", "son", "daughter", "brother", "sister", "relative"] as const;

const schema = z
	.object({
		relation: z.enum(RELATIONS).nullable(),
		firstName: z.string().trim().max(40),
		email: z.union([z.literal(""), z.email()]),
	})
	.refine((value) => value.relation !== null, { path: ["relation"] })
	.refine((value) => value.relation === "self" || value.firstName.length > 0, {
		path: ["firstName"],
	});
type Values = z.infer<typeof schema>;

function browserTimeZone() {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
	} catch {
		return "America/New_York";
	}
}

/**
 * "Who is this page for?" (design.md §5.14): it creates the household (a neutral slug, the
 * browser's time zone) and goes to the first page. A page for someone else waits for them to
 * confirm it before anyone can see it.
 */
export function WhoIsThisFor({
	mode,
	completeOnboarding,
}: {
	mode: "onboarding" | "another";
	completeOnboarding?: boolean;
}) {
	const t = useTranslations("onboarding.who");
	const errorText = useErrorText();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { user } = useSession();
	const create = useMutation(orpc.households.create.mutationOptions());

	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { relation: mode === "another" ? null : null, firstName: "", email: "" },
	});
	const relation = useWatch({ control: form.control, name: "relation" });
	const forSomeoneElse = relation !== null && relation !== "self";

	const onSubmit = form.handleSubmit(async (values) => {
		form.clearErrors("root");
		if (!values.relation) {
			return;
		}
		const candidateRelation: CandidateRelation = values.relation;
		try {
			const household = await create.mutateAsync({
				candidateRelation,
				candidateFirstName:
					candidateRelation === "self"
						? firstNameOf(user?.name || t("fallbackName"))
						: values.firstName,
				candidateEmail:
					candidateRelation !== "self" && values.email ? values.email : undefined,
				timeZone: browserTimeZone(),
			});
			await authClient.organization.setActive({ organizationSlug: household.slug });
			if (completeOnboarding) {
				await authClient.updateUser({ onboardingComplete: true });
			}
			await queryClient.invalidateQueries();
			await clearCache();
			router.replace(`/${household.slug}/begin`);
		} catch (error) {
			form.setError("root", { message: errorText(error) });
		}
	});

	const labelFor = (value: (typeof RELATIONS)[number]) => t(`relations.${value}`);

	return (
		<form onSubmit={onSubmit} className="gap-6 flex flex-col" noValidate>
			<div>
				<h1 className="font-display text-title">
					{mode === "another" ? t("titleAnother") : t("title")}
				</h1>
				<p className="mt-2 text-body text-muted-foreground">{t("lead")}</p>
			</div>

			<Controller
				control={form.control}
				name="relation"
				render={({ field }) => (
					<OptionRows
						options={
							mode === "another"
								? RELATIONS.filter((value) => value !== "self")
								: RELATIONS
						}
						value={field.value}
						onChange={field.onChange}
						label={t("title")}
						labelFor={labelFor}
					/>
				)}
			/>
			{form.formState.errors.relation && (
				<p className="text-meta text-warning">{t("chooseOne")}</p>
			)}

			{forSomeoneElse && (
				<div className="gap-4 animate-slip-in flex flex-col">
					<label className="gap-1.5 flex flex-col">
						<span className="label-caps text-muted-foreground">
							{t("theirFirstName")}
						</span>
						<Input
							{...form.register("firstName")}
							autoComplete="off"
							maxLength={40}
							aria-invalid={Boolean(form.formState.errors.firstName)}
						/>
						{form.formState.errors.firstName && (
							<span className="text-meta text-warning">{t("firstNameNeeded")}</span>
						)}
					</label>
					<label className="gap-1.5 flex flex-col">
						<span className="label-caps text-muted-foreground">{t("theirEmail")}</span>
						<Input
							type="email"
							{...form.register("email")}
							autoComplete="off"
							aria-invalid={Boolean(form.formState.errors.email)}
						/>
						<span
							className={cn(
								"text-meta",
								form.formState.errors.email
									? "text-warning"
									: "text-muted-foreground",
							)}
						>
							{form.formState.errors.email ? t("emailInvalid") : t("emailHint")}
						</span>
					</label>
					<p className="pencil text-body">{t("theyConfirm")}</p>
				</div>
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
					size="lg"
					loading={form.formState.isSubmitting}
				>
					{t("continue")}
				</Button>
			</div>
		</form>
	);
}
