"use client";

import { useAuthErrorMessages } from "@auth/hooks/errors-messages";
import { useSession } from "@auth/hooks/use-session";
import { config } from "@config";
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
import { passwordSchema } from "@repo/utils";
import { PasswordInput } from "@shared/components/PasswordInput";
import { useRouter } from "@shared/hooks/router";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { AuthHeading } from "./AuthHeading";
import { AuthSentSlip } from "./AuthSentSlip";

const formSchema = z.object({
	password: passwordSchema,
});

export function ResetPasswordForm() {
	const t = useTranslations();
	const { user } = useSession();
	const router = useRouter();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			password: "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ password }) => {
		try {
			const { error } = await authClient.resetPassword({
				token: token ?? undefined,
				newPassword: password,
			});

			if (error) {
				throw error;
			}

			if (user) {
				router.push(config.redirectAfterSignIn);
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
				overline={t("auth.resetPassword.overline")}
				title={t("auth.resetPassword.title")}
				lead={t("auth.resetPassword.message")}
			/>

			{form.formState.isSubmitSuccessful ? (
				<AuthSentSlip title={t("auth.resetPassword.hints.success")} />
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
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("auth.resetPassword.newPassword")}</FormLabel>
									<FormControl>
										<PasswordInput
											autoComplete="new-password"
											showPasswordCriteria
											showGenerateButton
											{...field}
										/>
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
							{t("auth.resetPassword.submit")}
						</Button>
					</form>
				</Form>
			)}

			<p className="mt-8 text-center text-body">
				<Link href="/login" className="text-seal-ink underline underline-offset-4">
					← {t("auth.resetPassword.backToSignin")}
				</Link>
			</p>
		</>
	);
}
