import { config } from "@config";
import { cn, Logo } from "@repo/ui";
import type { PropsWithChildren } from "react";

import { Footer } from "./Footer";

/**
 * Sign in, begin a page, onboarding and invitations: one sheet of paper on the desk, under a
 * slim masthead with the Rishta lockup. The sheet carries the double marigold rule; a pencil
 * note may sit in its left margin. No glow, no blur, no locale switcher, no colour toggle.
 */
export function AuthWrapper({
	children,
	contentClass,
}: PropsWithChildren<{ contentClass?: string }>) {
	return (
		<div className="flex min-h-dvh w-full flex-col">
			<header className="h-14 border-b border-border">
				<div className="px-5 md:px-8 max-w-5xl mx-auto flex h-full w-full items-center">
					<a
						href={config.marketingUrl ?? "/"}
						className="-mx-1 px-1 py-2 focus-visible:outline-2 focus-visible:outline-ring"
					>
						<Logo variant="lockup" />
					</a>
				</div>
			</header>

			<main className="px-0 sm:px-5 pt-8 pb-12 md:pt-16 flex flex-1 justify-center">
				<div className={cn("max-w-md relative w-full", contentClass)}>
					<div className="max-sm:border-x-0 border border-border bg-card">
						<div aria-hidden="true" className="double-rule" />
						<div className="px-5 py-8 md:px-10 md:py-10">{children}</div>
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
}
