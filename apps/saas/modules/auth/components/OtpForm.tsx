"use client";

import { useAuthErrorMessages } from "@auth/hooks/errors-messages";
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
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@repo/ui/components/input-otp";
import { useRouter } from "@shared/hooks/router";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { AuthHeading } from "./AuthHeading";

const formSchema = z.object({
	code: z.string().min(6).max(6),
});

export function OtpForm() {
	const t = useTranslations();
	const router = useRouter();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const searchParams = useSearchParams();

	const invitationId = searchParams.get("invitationId");
	const redirectTo = searchParams.get("redirectTo");

	const redirectPath = invitationId
		? `/organization-invitation/${invitationId}`
		: (redirectTo ?? config.redirectAfterSignIn);

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			code: "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ code }) => {
		try {
			const { error } = await authClient.twoFactor.verifyTotp({
				code,
			});

			if (error) {
				throw error;
			}

			router.replace(redirectPath);
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
				overline={t("auth.verify.overline")}
				title={t("auth.verify.title")}
				lead={t("auth.verify.message")}
			/>

			<Form {...form}>
				<form className="gap-5 flex flex-col items-stretch" onSubmit={onSubmit}>
					{form.formState.errors.root && (
						<Alert variant="error">
							<AlertTitle>{form.formState.errors.root.message}</AlertTitle>
						</Alert>
					)}

					<FormField
						control={form.control}
						name="code"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("auth.verify.code")}</FormLabel>
								<FormControl>
									<InputOTP
										maxLength={6}
										{...field}
										autoComplete="one-time-code"
										onChange={(value) => {
											field.onChange(value);
											void onSubmit();
										}}
									>
										<InputOTPGroup>
											<InputOTPSlot
												className="size-12 text-section tabular"
												index={0}
											/>
											<InputOTPSlot
												className="size-12 text-section tabular"
												index={1}
											/>
											<InputOTPSlot
												className="size-12 text-section tabular"
												index={2}
											/>
										</InputOTPGroup>
										<InputOTPSeparator className="opacity-40" />
										<InputOTPGroup>
											<InputOTPSlot
												className="size-12 text-section tabular"
												index={3}
											/>
											<InputOTPSlot
												className="size-12 text-section tabular"
												index={4}
											/>
											<InputOTPSlot
												className="size-12 text-section tabular"
												index={5}
											/>
										</InputOTPGroup>
									</InputOTP>
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
						{t("auth.verify.submit")}
					</Button>
				</form>
			</Form>

			<p className="mt-8 text-center text-body">
				<Link href="/login" className="text-seal-ink underline underline-offset-4">
					← {t("auth.verify.backToSignin")}
				</Link>
			</p>
		</>
	);
}
