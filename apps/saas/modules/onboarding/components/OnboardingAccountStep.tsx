"use client";

import { useSession } from "@auth/hooks/use-session";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { Button } from "@repo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().trim().min(1).max(80),
});

/** Your name, as it signs your notes and pencil notes. No photo: the avatar tile is initials. */
export function OnboardingAccountStep({ onCompleted }: { onCompleted: () => void }) {
	const t = useTranslations();
	const { user } = useSession();
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: user?.name ?? "",
		},
	});

	useEffect(() => {
		if (user) {
			form.setValue("name", user.name ?? "");
		}
	}, [user]); // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps

	const onSubmit = form.handleSubmit(async ({ name }) => {
		form.clearErrors("root");

		try {
			await authClient.updateUser({
				name,
			});

			onCompleted();
		} catch {
			form.setError("root", {
				type: "server",
				message: t("onboarding.notifications.accountSetupFailed"),
			});
		}
	});

	return (
		<Form {...form}>
			<form className="gap-6 flex flex-col items-stretch" onSubmit={onSubmit}>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("onboarding.account.name")}</FormLabel>
							<FormControl>
								<Input {...field} autoComplete="name" />
							</FormControl>
							<p className="text-meta text-muted-foreground">
								{t("onboarding.account.nameHint")}
							</p>
						</FormItem>
					)}
				/>

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
						{t("onboarding.continue")}
					</Button>
				</div>
			</form>
		</Form>
	);
}
