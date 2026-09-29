import type { SaasConfig } from "./types";

export const config = {
	appName: "Rishta",
	docsUrl: process.env.NEXT_PUBLIC_DOCS_URL as string | undefined,
	marketingUrl: process.env.NEXT_PUBLIC_MARKETING_URL as string | undefined,
	// Paper and Lamp; "Follow my phone" is the default and resolves to Paper with no preference.
	enabledThemes: ["light", "dark"],
	defaultTheme: "system",
	redirectAfterSignIn: "/",
	redirectAfterLogout: "/login",
} as const satisfies SaasConfig;
