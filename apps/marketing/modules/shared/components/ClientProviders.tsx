"use client";

import { ProgressProvider } from "@bprogress/next/app";
import type { PropsWithChildren } from "react";

export function ClientProviders({ children }: PropsWithChildren) {
	return (
		<ProgressProvider
			height="2px"
			color="var(--color-foreground)"
			options={{ showSpinner: false }}
			shallowRouting
			delay={250}
		>
			{children}
		</ProgressProvider>
	);
}
