import type { MarketingConfig } from "./types";

export const config = {
	appName: "Rishta",
	docsUrl: process.env.NEXT_PUBLIC_DOCS_URL as string | undefined,
	saasUrl: process.env.NEXT_PUBLIC_SAAS_URL as string | undefined,
	// Marketing is Paper only (design.md §7, §15). Lamp belongs to the app, at night.
	enabledThemes: ["light"],
	defaultTheme: "light",
} as const satisfies MarketingConfig;
