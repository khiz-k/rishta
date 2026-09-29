"use client";

import { ProgressProvider } from "@bprogress/next/app";
import type { PropsWithChildren } from "react";

export function ClientProviders({ children }: PropsWithChildren) {
	// A hairline of ink across the top while a route loads: no spinner, no colour.
	return (
		<ProgressProvider
			height="2px"
			color="var(--foreground)"
			options={{ showSpinner: false }}
			shallowRouting
			delay={250}
		>
			{children}
		</ProgressProvider>
	);
}
