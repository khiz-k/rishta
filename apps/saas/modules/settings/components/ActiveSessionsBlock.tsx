"use client";
import { useSession } from "@auth/hooks/use-session";
import { sessionQueryKey } from "@auth/lib/api";
import { config } from "@config";
import { authClient } from "@repo/auth/client";
import { Button } from "@repo/ui/components/button";
import { toastSuccess } from "@repo/ui/components/toast";
import { RowsSkeleton } from "@shared/components/PaperSkeleton";
import { SettingsItem } from "@shared/components/SettingsItem";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

/**
 * Where you're signed in (design.md §5.13): hairline rows in words, this device first in the
 * wording, and a worded Sign out on each row. No device glyphs and no card per row.
 */
export function ActiveSessionsBlock() {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { session: currentSession } = useSession();

	const { data: sessions, isPending } = useQuery({
		queryKey: ["active-sessions"],
		queryFn: async () => {
			const { data, error } = await authClient.listSessions();

			if (error) {
				throw error;
			}

			return data;
		},
	});

	const revokeSession = async (token: string) => {
		await authClient.revokeSession(
			{
				token,
			},
			{
				onSuccess: async () => {
					toastSuccess(
						t(
							"settings.account.security.activeSessions.notifications.revokeSession.success",
						),
					);

					if (currentSession?.token === token) {
						await queryClient.refetchQueries({
							queryKey: sessionQueryKey,
						});

						window.location.href = new URL(
							config.redirectAfterLogout,
							window.location.origin,
						).toString();
					} else {
						await queryClient.invalidateQueries({
							queryKey: ["active-sessions"],
						});
					}
				},
			},
		);
	};

	return (
		<SettingsItem
			title={t("settings.account.security.activeSessions.title")}
			description={t("settings.account.security.activeSessions.description")}
		>
			{isPending ? (
				<RowsSkeleton rows={2} />
			) : (
				<ul className="border-t border-border">
					{sessions?.map((session) => {
						const current = session.id === currentSession?.id;
						return (
							<li
								key={session.id}
								className="py-2.5 gap-3 flex items-center justify-between border-b border-border"
							>
								<span className="min-w-0">
									<span className="block text-body">
										{current
											? t(
													"settings.account.security.activeSessions.currentSession",
												)
											: session.ipAddress ||
												t(
													"settings.account.security.activeSessions.otherDevice",
												)}
									</span>
									{session.userAgent && (
										<span className="block truncate text-meta text-muted-foreground">
											{session.userAgent}
										</span>
									)}
								</span>
								<Button
									size="sm"
									variant="ghost"
									className="shrink-0"
									onClick={() => void revokeSession(session.token)}
								>
									{t("settings.account.security.activeSessions.signOut")}
								</Button>
							</li>
						);
					})}
				</ul>
			)}
		</SettingsItem>
	);
}
