import { config } from "@config";
import { cn, Toaster } from "@repo/ui";
import { ApiClientProvider } from "@shared/components/ApiClientProvider";
import { AppThemeProvider } from "@shared/components/AppThemeProvider";
import { ClientProviders } from "@shared/components/ClientProviders";
import { fontVariables } from "@shared/lib/fonts";
import type { Metadata, Viewport } from "next";
import { getLocale } from "next-intl/server";

import "./globals.css";
import "cropperjs/dist/cropper.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { PropsWithChildren } from "react";

export const metadata: Metadata = {
	title: {
		absolute: config.appName,
		default: config.appName,
		template: `%s · ${config.appName}`,
	},
	// Neutral on a lock screen: the icon is the pressed seal, the name is just "Rishta".
	applicationName: config.appName,
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#f5efe3" },
		{ media: "(prefers-color-scheme: dark)", color: "#1a1612" },
	],
};

export default async function RootLayout({ children }: PropsWithChildren) {
	const locale = await getLocale();

	return (
		<html lang={locale} suppressHydrationWarning className={fontVariables}>
			<body className={cn("min-h-dvh bg-background text-foreground antialiased")}>
				<NuqsAdapter>
					{/* Messages are provided per route group, so the family link ships only its own. */}
					<AppThemeProvider>
						<ApiClientProvider>
							<ClientProviders>
								{children}
								<Toaster
									position="bottom-center"
									offset={{ bottom: 24 }}
									mobileOffset={{ bottom: 132 }}
									gap={8}
								/>
							</ClientProviders>
						</ApiClientProvider>
					</AppThemeProvider>
				</NuqsAdapter>
			</body>
		</html>
	);
}
