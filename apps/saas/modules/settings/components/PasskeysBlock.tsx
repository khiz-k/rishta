"use client";
import { userPasskeyQueryKey, useUserPasskeysQuery } from "@auth/lib/api";
import { authClient } from "@repo/auth/client";
import { Button } from "@repo/ui/components/button";
import { toastError, toastPromise, toastSuccess } from "@repo/ui/components/toast";
import { RowsSkeleton } from "@shared/components/PaperSkeleton";
import { SettingsItem } from "@shared/components/SettingsItem";
import { useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";

/** Passkeys as hairline rows with a worded Remove, the same way the household lists its links. */
export function PasskeysBlock() {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const formatter = useFormatter();

	const { data: passkeys, isPending } = useUserPasskeysQuery();

	const addPasskey = async () => {
		await authClient.passkey.addPasskey({
			fetchOptions: {
				onSuccess: async () => {
					await queryClient.invalidateQueries({
						queryKey: userPasskeyQueryKey,
					});

					toastSuccess(
						t(
							"settings.account.security.passkeys.notifications.addPasskey.success.title",
						),
					);
				},
				onError: () => {
					toastError(
						t(
							"settings.account.security.passkeys.notifications.addPasskey.error.title",
						),
					);
				},
			},
		});
	};

	const deletePasskey = (id: string) => {
		toastPromise(
			async () => {
				await authClient.passkey.deletePasskey({
					id,
					fetchOptions: {
						onSuccess: () => {
							void queryClient.invalidateQueries({
								queryKey: userPasskeyQueryKey,
							});
						},
					},
				});
			},
			{
				loading: t(
					"settings.account.security.passkeys.notifications.deletePasskey.loading.title",
				),
				success: t(
					"settings.account.security.passkeys.notifications.deletePasskey.success.title",
				),
				error: t(
					"settings.account.security.passkeys.notifications.deletePasskey.error.title",
				),
			},
		);
	};

	return (
		<SettingsItem
			title={t("settings.account.security.passkeys.title")}
			description={t("settings.account.security.passkeys.description")}
		>
			<div className="gap-4 flex flex-col items-start">
				{isPending ? (
					<RowsSkeleton rows={1} className="w-full" />
				) : passkeys?.length ? (
					<ul className="w-full border-t border-border">
						{passkeys.map((passkey) => (
							<li
								key={passkey.id}
								className="py-2.5 gap-3 flex items-center justify-between border-b border-border"
							>
								<span className="min-w-0">
									<span className="block text-body">
										{[passkey.name, passkey.deviceType]
											.filter(Boolean)
											.join(" · ")}
									</span>
									<span className="block text-meta text-muted-foreground">
										{t("settings.account.security.passkeys.added", {
											date: formatter.dateTime(new Date(passkey.createdAt), {
												dateStyle: "medium",
											}),
										})}
									</span>
								</span>
								<Button
									size="sm"
									variant="ghost"
									className="shrink-0"
									onClick={() => deletePasskey(passkey.id)}
								>
									{t("settings.account.security.passkeys.remove")}
								</Button>
							</li>
						))}
					</ul>
				) : null}

				<Button variant="secondary" onClick={() => void addPasskey()}>
					{t("settings.account.security.passkeys.addPasskey")}
				</Button>
			</div>
		</SettingsItem>
	);
}
