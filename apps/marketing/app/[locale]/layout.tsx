import { AnalyticsScript } from "@analytics";
import { config } from "@config";
import { config as i18nConfig } from "@i18n/config";
import { cn } from "@repo/ui";
import { ClientProviders } from "@shared/components/ClientProviders";
import { ConsentBanner } from "@shared/components/ConsentBanner";
import { ConsentProvider } from "@shared/components/ConsentProvider";
import { Footer } from "@shared/components/Footer";
import { Masthead } from "@shared/components/Masthead";
import { getBaseUrl } from "@shared/lib/base-url";
import { fontVariables } from "@shared/lib/fonts";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { PropsWithChildren } from "react";

const locales = Object.keys(i18nConfig.locales) as string[];

export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await props.params;
	const t = await getTranslations({ locale, namespace: "metadata" });
	const title = `${config.appName} · ${t("title")}`;
	const description = t("description");

	return {
		metadataBase: new URL(getBaseUrl()),
		title: {
			default: title,
			template: `%s · ${config.appName}`,
		},
		description,
		applicationName: config.appName,
		openGraph: {
			type: "website",
			siteName: config.appName,
			title,
			description,
			locale,
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
		},
	};
}

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: "#f5efe3",
	colorScheme: "light",
};

export default async function MarketingLayout({
	children,
	params,
}: PropsWithChildren<{ params: Promise<{ locale: string }> }>) {
	const { locale } = await params;

	if (!locales.includes(locale)) {
		notFound();
	}

	setRequestLocale(locale);

	const messages = await getMessages();
	const t = await getTranslations({ locale, namespace: "common" });

	const cookieStore = await cookies();
	const consentCookie = cookieStore.get("consent");

	return (
		<html lang={locale} suppressHydrationWarning className={fontVariables}>
			<body className={cn("min-h-dvh bg-background text-foreground antialiased")}>
				<ConsentProvider initialConsent={consentCookie?.value === "true"}>
					<NextIntlClientProvider locale={locale} messages={messages}>
						<ClientProviders>
							{/* Paper only: marketing never follows the phone into Lamp. */}
							<ThemeProvider
								attribute="class"
								disableTransitionOnChange
								enableSystem={false}
								forcedTheme={config.defaultTheme}
								defaultTheme={config.defaultTheme}
								themes={Array.from(config.enabledThemes)}
							>
								<a
									href="#content"
									className="px-4 py-2 left-4 top-2 sr-only z-50 bg-card text-foreground focus:not-sr-only focus:absolute"
								>
									{t("skipToContent")}
								</a>

								<Masthead />

								<main id="content" className="min-h-[70dvh]">
									{children}
								</main>

								<Footer />

								<ConsentBanner />
								<AnalyticsScript />
							</ThemeProvider>
						</ClientProviders>
					</NextIntlClientProvider>
				</ConsentProvider>
			</body>
		</html>
	);
}
