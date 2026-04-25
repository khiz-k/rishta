import { config } from "@config";
import { cn, Logo } from "@repo/ui";
import type { PropsWithChildren } from "react";

import { ColorModeToggle } from "./ColorModeToggle";
import { Footer } from "./Footer";
import { LocaleSwitch } from "./LocaleSwitch";

export function AuthWrapper({
	children,
	contentClass,
}: PropsWithChildren<{ contentClass?: string }>) {
	return (
		<div className="relative py-6 flex min-h-screen w-full overflow-hidden">
			{/* Subtle rose glow */}
			<div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />

			<div className="relative gap-8 flex w-full flex-col items-center justify-between">
				<div className="container">
					<div className="flex items-center justify-between">
						<a href={config.marketingUrl ?? "/"} className="block">
							<Logo />
						</a>

						<div className="gap-2 flex items-center justify-end">
							<LocaleSwitch />
							<ColorModeToggle />
						</div>
					</div>
				</div>

				<div className="container flex justify-center">
					<main
						className={cn(
							"max-w-md p-6 lg:p-8 w-full rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm",
							contentClass,
						)}
					>
						{children}
					</main>
				</div>

				<Footer />
			</div>
		</div>
	);
}
