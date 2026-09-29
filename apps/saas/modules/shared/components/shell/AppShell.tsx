"use client";

import { HouseholdProvider } from "@household/components/HouseholdProvider";
import type { Household } from "@shared/lib/api-types";
import { useTranslations } from "next-intl";
import type { PropsWithChildren, ReactNode } from "react";

import { BottomStack } from "./BottomStack";
import { Masthead, TopLine } from "./Masthead";
import { ShellProvider } from "./ShellContext";

/**
 * Rishta's shell: no sidebar, ever. A slim masthead (Folio · Letters · My Biodata) on desktop,
 * a 44px top line and a 56px text-only bottom bar on the phone, the avatar tile for everything
 * else. Household screens, account settings and admin all use it.
 */
export function AppShell({
	household,
	children,
	subnav,
	contextFallback,
}: PropsWithChildren<{
	household: Household | null;
	subnav?: ReactNode;
	contextFallback?: string;
}>) {
	const t = useTranslations("shell");
	const slug = household?.slug ?? null;

	const shell = (
		<ShellProvider hasBottomBar={Boolean(slug)}>
			<a
				href="#main"
				className="left-2 top-2 px-3 py-2 sr-only z-50 bg-card text-foreground focus:not-sr-only focus:fixed"
			>
				{t("skipToContent")}
			</a>
			<Masthead slug={slug} />
			<TopLine slug={slug} fallback={contextFallback} />
			{subnav}
			<main
				id="main"
				className="md:pb-16 pb-[calc(var(--bar-height)+env(safe-area-inset-bottom)+1.5rem)]"
			>
				{children}
			</main>
			<BottomStack slug={slug} withBottomBar={Boolean(slug)} />
		</ShellProvider>
	);

	return household ? <HouseholdProvider household={household}>{shell}</HouseholdProvider> : shell;
}
