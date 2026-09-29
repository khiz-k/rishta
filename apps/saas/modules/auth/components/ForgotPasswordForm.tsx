"use client";

import { useAuthErrorMessages } from "@auth/hooks/errors-messages";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { Alert, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { AuthHeading } from "./AuthHeading";
import { AuthMarginNote } from "./AuthMarginNote";
import { AuthSentSlip } from "./AuthSentSlip";

const formSchema = z.object({
	email: z.email(),
});

export function ForgotPasswordForm() {
	const t = useTranslations();
	const { getAuthErrorMessage } = useAuthErrorMessages();

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ email }) => {
		try {
			const redirectTo = new URL("/reset-password", window.location.origin).toString();

			const { error } = await authClient.requestPasswordReset({
				email,
				redirectTo,
			});

			if (error) {
				throw error;
			}
		} catch (e) {
			form.setError("root", {
				message: getAuthErrorMessage(
					e && typeof e === "object" && "code" in e ? (e.code as string) : undefined,
				),
			});
		}
	});

	return (
		<>
			<AuthHeading
				overline={t("auth.forgotPassword.overline")}
				title={t("auth.forgotPassword.title")}
				lead={t("auth.forgotPassword.message")}
			/>

			{form.formState.isSubmitSuccessful ? (
				<AuthSentSlip
					title={t("auth.forgotPassword.hints.linkSent.title")}
					message={t("auth.forgotPassword.hints.linkSent.message")}
				/>
			) : (
				<Form {...form}>
					<form className="gap-5 flex flex-col items-stretch" onSubmit={onSubmit}>
						{form.formState.errors.root && (
							<Alert variant="error">
								<AlertTitle>{form.formState.errors.root.message}</AlertTitle>
							</Alert>
						)}

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("auth.forgotPassword.email")}</FormLabel>
									<FormControl>
										<Input {...field} type="email" autoComplete="email" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							variant="primary"
							className="w-full"
							loading={form.formState.isSubmitting}
						>
							{t("auth.forgotPassword.submit")}
						</Button>
					</form>
				</Form>
			)}

			<p className="mt-8 text-center text-body">
				<Link href="/login" className="text-seal-ink underline underline-offset-4">
					← {t("auth.forgotPassword.backToSignin")}
				</Link>
			</p>

			<AuthMarginNote>{t("auth.forgotPassword.marginNote")}</AuthMarginNote>
		</>
	);
}
