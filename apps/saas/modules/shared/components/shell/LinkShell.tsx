"use client";

import { HouseholdProvider } from "@household/components/HouseholdProvider";
import { useRouter } from "@shared/hooks/router";
import type { Household } from "@shared/lib/api-types";
import { useTranslations } from "next-intl";
import type { PropsWithChildren } from "react";

import { AvatarTile } from "./AvatarTile";
import { ShellProvider, useShell } from "./ShellContext";

function LinkTopLine({
	backHref,
	backLabel,
	reference,
}: {
	backHref: string;
	backLabel: string;
	reference?: string;
}) {
	const router = useRouter();
	const shell = useShell();
	return (
		<header
			data-print-hide
			className="top-0 px-3 md:px-6 gap-3 sticky z-40 flex h-(--topline-height) items-center border-b border-border bg-background"
		>
			<button
				type="button"
				onClick={() => {
					if (
						window.history.length > 1 &&
						document.referrer.startsWith(window.location.origin)
					) {
						router.back();
					} else {
						router.push(backHref);
					}
				}}
				className="min-h-11 px-1 shrink-0 text-ui text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
			>
				← {backLabel}
			</button>
			<p className="min-w-0 flex-1 truncate text-right text-ref text-muted-foreground tabular">
				{reference ?? shell?.contextLine ?? ""}
			</p>
			<AvatarTile />
		</header>
	);
}

/**
 * Chrome-free link pages (design.md §4.3): a single 44px line with a back link and the page's
 * reference, then the page itself and, for a candidate, its margin bar. No masthead, no bottom
 * bar.
 */
export function LinkShell({
	household,
	backHref,
	backLabel,
	reference,
	children,
}: PropsWithChildren<{
	household: Household;
	backHref: string;
	backLabel?: string;
	reference?: string;
}>) {
	const t = useTranslations("shell");
	return (
		<HouseholdProvider household={household}>
			<ShellProvider hasBottomBar={false}>
				<LinkTopLine
					backHref={backHref}
					backLabel={backLabel ?? t("backLabel")}
					reference={reference}
				/>
				<main
					id="main"
					className="md:pb-16 pb-[calc(var(--bar-height)*2+env(safe-area-inset-bottom))]"
				>
					{children}
				</main>
				<LinkBottomStack />
			</ShellProvider>
		</HouseholdProvider>
	);
}

function LinkBottomStack() {
	const shell = useShell();
	return (
		<div
			data-print-hide
			className={
				shell?.keyboardOpen
					? "hidden"
					: "inset-x-0 bottom-0 fixed z-40 bg-background pb-safe"
			}
		>
			<div ref={shell?.registerSlot} />
		</div>
	);
}
