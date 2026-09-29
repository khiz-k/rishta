"use client";

import { useAuthErrorMessages } from "@auth/hooks/errors-messages";
import { sessionQueryKey } from "@auth/lib/api";
import { config } from "@config";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrganizationInvitationAlert } from "@organizations/components/OrganizationInvitationAlert";
import { authClient } from "@repo/auth/client";
import { config as authConfig } from "@repo/auth/config";
import { Alert, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { useRouter } from "@shared/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { withQuery } from "ufo";
import { z } from "zod";

import { type OAuthProvider, oAuthProviders } from "../constants/oauth-providers";
import { useSession } from "../hooks/use-session";
import { AuthDivider } from "./AuthDivider";
import { AuthHeading } from "./AuthHeading";
import { AuthMarginNote } from "./AuthMarginNote";
import { AuthSentSlip } from "./AuthSentSlip";
import { LoginModeSwitch } from "./LoginModeSwitch";
import { SocialSigninButton } from "./SocialSigninButton";

const formSchema = z.union([
	z.object({
		mode: z.literal("magic-link"),
		email: z.email(),
	}),
	z.object({
		mode: z.literal("password"),
		email: z.email(),
		password: z.string().min(1),
	}),
]);

export function LoginForm() {
	const t = useTranslations();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const { user, loaded: sessionLoaded } = useSession();

	const [showPassword, setShowPassword] = useState(false);
	const invitationId = searchParams.get("invitationId");
	const email = searchParams.get("email");
	const redirectTo = searchParams.get("redirectTo");

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: email ?? "",
			password: "",
			mode: authConfig.enablePasswordLogin ? "password" : "magic-link",
		},
	});

	const redirectPath = invitationId
		? `/organization-invitation/${invitationId}`
		: (redirectTo ?? config.redirectAfterSignIn);

	useEffect(() => {
		if (sessionLoaded && user) {
			router.replace(redirectPath);
		}
	}, [user, sessionLoaded]); // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			if (values.mode === "password") {
				const { data, error } = await authClient.signIn.email({
					...values,
				});

				if (error) {
					throw error;
				}

				if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
					router.replace(
						withQuery("/verify", Object.fromEntries(searchParams.entries())),
					);
					return;
				}

				await queryClient.invalidateQueries({
					queryKey: sessionQueryKey,
				});

				router.replace(redirectPath);
			} else {
				const { error } = await authClient.signIn.magicLink({
					...values,
					callbackURL: redirectPath,
				});

				if (error) {
					throw error;
				}
			}
		} catch (e) {
			form.setError("root", {
				message: getAuthErrorMessage(
					e && typeof e === "object" && "code" in e ? (e.code as string) : undefined,
				),
			});
		}
	});

	const signInWithPasskey = async () => {
		try {
			await authClient.signIn.passkey();

			router.replace(redirectPath);
		} catch (e) {
			form.setError("root", {
				message: getAuthErrorMessage(
					e && typeof e === "object" && "code" in e ? (e.code as string) : undefined,
				),
			});
		}
	};

	const signinMode = form.watch("mode");

	return (
		<div>
			<AuthHeading
				overline={t("auth.login.overline")}
				title={t("auth.login.title")}
				lead={t("auth.login.subtitle")}
			/>

			{form.formState.isSubmitSuccessful && signinMode === "magic-link" ? (
				<AuthSentSlip
					title={t("auth.login.hints.linkSent.title")}
					message={t("auth.login.hints.linkSent.message")}
				/>
			) : (
				<>
					{invitationId && <OrganizationInvitationAlert className="mb-6" />}

					<Form {...form}>
						<form className="space-y-5" onSubmit={onSubmit}>
							{authConfig.enableMagicLink && authConfig.enablePasswordLogin && (
								<LoginModeSwitch
									activeMode={signinMode}
									onChange={(mode) =>
										form.setValue("mode", mode as typeof signinMode)
									}
								/>
							)}

							{form.formState.isSubmitted && form.formState.errors.root?.message && (
								<Alert variant="error">
									<AlertTitle>{form.formState.errors.root.message}</AlertTitle>
								</Alert>
							)}

							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("auth.signup.email")}</FormLabel>
										<FormControl>
											<Input {...field} type="email" autoComplete="email" />
										</FormControl>
									</FormItem>
								)}
							/>

							{authConfig.enablePasswordLogin && signinMode === "password" && (
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<div className="gap-4 flex items-baseline justify-between">
												<FormLabel>{t("auth.signup.password")}</FormLabel>

												<Link
													href="/forgot-password"
													className="text-meta text-seal-ink underline-offset-4 hover:underline"
												>
													{t("auth.login.forgotPassword")}
												</Link>
											</div>
											<FormControl>
												<div className="relative">
													<Input
														type={showPassword ? "text" : "password"}
														className="pr-20"
														{...field}
														autoComplete="current-password"
													/>
													{/* Words before icons: "Show" and "Hide", not an eye. */}
													<button
														type="button"
														onClick={() =>
															setShowPassword(!showPassword)
														}
														aria-pressed={showPassword}
														aria-label={
															showPassword
																? t("common.password.hide")
																: t("common.password.show")
														}
														className="inset-y-0 right-0 px-3 absolute flex cursor-pointer items-center text-ui ui-semi text-seal-ink focus-visible:outline-2 focus-visible:outline-ring"
													>
														{showPassword
															? t("auth.login.hidePassword")
															: t("auth.login.showPassword")}
													</button>
												</div>
											</FormControl>
										</FormItem>
									)}
								/>
							)}

							<Button
								className="w-full"
								type="submit"
								variant="primary"
								loading={form.formState.isSubmitting}
							>
								{signinMode === "magic-link"
									? t("auth.login.sendMagicLink")
									: t("auth.login.submit")}
							</Button>
						</form>
					</Form>

					{(authConfig.enablePasskeys ||
						(authConfig.enableSignup && authConfig.enableSocialLogin)) && (
						<>
							<AuthDivider label={t("auth.login.continueWith")} />

							<div className="gap-2 sm:grid-cols-2 grid grid-cols-1 items-stretch">
								{authConfig.enableSignup &&
									authConfig.enableSocialLogin &&
									Object.keys(oAuthProviders).map((providerId) => (
										<SocialSigninButton
											key={providerId}
											provider={providerId as OAuthProvider}
										/>
									))}

								{authConfig.enablePasskeys && (
									<Button
										variant="outline"
										className="sm:col-span-2 w-full"
										onClick={() => signInWithPasskey()}
									>
										{t("auth.login.loginWithPasskey")}
									</Button>
								)}
							</div>
						</>
					)}

					{authConfig.enableSignup && (
						<p className="mt-8 text-center text-body">
							<span className="text-muted-foreground">
								{t("auth.login.dontHaveAnAccount")}{" "}
							</span>
							<Link
								href={withQuery(
									"/signup",
									Object.fromEntries(searchParams.entries()),
								)}
								className="text-seal-ink underline underline-offset-4"
							>
								{t("auth.login.createAnAccount")}
							</Link>
						</p>
					)}
				</>
			)}

			<AuthMarginNote>{t("auth.login.marginNote")}</AuthMarginNote>
		</div>
	);
}
