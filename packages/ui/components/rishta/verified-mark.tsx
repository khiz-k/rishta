import type { ReactNode } from "react";

import { cn } from "../../lib";

/** A small square stamp with a tick, always with words ("Verified email"). */
export function VerifiedMark({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<span className={cn("gap-1.5 inline-flex items-center text-meta", className)}>
			<svg
				viewBox="0 0 16 16"
				aria-hidden="true"
				className="size-3.5 shrink-0"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.25"
			>
				<rect x="1" y="1" width="14" height="14" />
				<path d="M4.3 8.2l2.4 2.3 5-5.2" strokeLinecap="square" />
			</svg>
			<span>{children}</span>
		</span>
	);
}
