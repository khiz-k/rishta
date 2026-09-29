"use client";

import { config } from "@config";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

/**
 * Paper, Lamp or "Follow my phone" (the default). The family link (/f/…) is always Paper:
 * a parent opening it from WhatsApp at night still reads ink on ivory.
 */
export function AppThemeProvider({ children }: PropsWithChildren) {
	const pathname = usePathname();
	const forcePaper = pathname?.startsWith("/f/") ?? false;

	return (
		<ThemeProvider
			attribute="class"
			disableTransitionOnChange
			enableSystem
			defaultTheme={config.defaultTheme}
			themes={Array.from(config.enabledThemes)}
			forcedTheme={forcePaper ? "light" : undefined}
		>
			{children}
		</ThemeProvider>
	);
}
