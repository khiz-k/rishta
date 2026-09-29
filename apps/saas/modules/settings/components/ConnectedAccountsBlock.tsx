"use client";
import { type OAuthProvider, oAuthProviders } from "@auth/constants/oauth-providers";
import { useUserAccountsQuery } from "@auth/lib/api";
import { authClient } from "@repo/auth/client";
import { Button } from "@repo/ui/components/button";
import { SettingsItem } from "@shared/components/SettingsItem";
import { useTranslations } from "next-intl";

/** Other ways to sign in, one hairline row each: the provider's name, then Connected or Connect. */
export function ConnectedAccountsBlock() {
	const t = useTranslations();

	const { data, isPending } = useUserAccountsQuery();

	const isProviderLinked = (provider: OAuthProvider) =>
		data?.some((account) => account.providerId === provider);

	const linkProvider = async (provider: OAuthProvider) => {
		const callbackURL = window.location.href;
		if (!isProviderLinked(provider)) {
			await authClient.linkSocial({
				provider,
				callbackURL,
			});
		}
	};

	return (
		<SettingsItem title={t("settings.account.security.connectedAccounts.title")}>
			<ul className="border-t border-border">
				{Object.entries(oAuthProviders).map(([provider, providerData]) => {
					const isLinked = isProviderLinked(provider as OAuthProvider);

					return (
						<li
							key={provider}
							className="min-h-11 py-1.5 gap-3 flex items-center justify-between border-b border-border"
						>
							<span className="text-body">{providerData.name}</span>
							{isPending ? (
								<span aria-hidden="true" className="h-4 w-20 bg-muted" />
							) : isLinked ? (
								<span className="text-meta text-success">
									{t("settings.account.security.connectedAccounts.connected")}
								</span>
							) : (
								<Button
									size="sm"
									variant="ghost"
									onClick={() => void linkProvider(provider as OAuthProvider)}
								>
									{t("settings.account.security.connectedAccounts.connect")}
								</Button>
							)}
						</li>
					);
				})}
			</ul>
		</SettingsItem>
	);
}
