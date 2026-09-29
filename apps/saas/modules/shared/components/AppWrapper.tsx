"use client";

import type { PropsWithChildren } from "react";

import { AppShell } from "./shell/AppShell";

/**
 * The template's AppWrapper is now Rishta's masthead shell (design.md §4.1): no sidebar. Used
 * where no household is loaded (the not-found page).
 */
export function AppWrapper({ children }: PropsWithChildren) {
	return <AppShell household={null}>{children}</AppShell>;
}
