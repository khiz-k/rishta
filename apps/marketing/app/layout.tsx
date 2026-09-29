import { config } from "@config";
import { getBaseUrl } from "@shared/lib/base-url";
import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

import "./globals.css";

export const metadata: Metadata = {
	// Routes outside [locale] (e.g. /_not-found) still inherit the root share image, so resolve it
	// against the marketing URL instead of Next's localhost fallback.
	metadataBase: new URL(getBaseUrl()),
	title: {
		absolute: config.appName,
		default: config.appName,
		template: `%s | ${config.appName}`,
	},
};

export default function RootLayout({ children }: PropsWithChildren) {
	return children;
}
