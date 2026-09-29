import { cn } from "@repo/ui";
import type { PropsWithChildren, ReactNode } from "react";

/**
 * A slip of paper laid on the desk: the one shape for empty states, errors, closed pages and
 * gentle confirmations (it replaces toasts and empty-state cards). Words first; Tiro 18/28.
 */
export function PaperSlip({
	children,
	title,
	actions,
	tone = "plain",
	className,
	role,
	as: Component = "div",
}: PropsWithChildren<{
	title?: ReactNode;
	actions?: ReactNode;
	tone?: "plain" | "sealed" | "caution";
	className?: string;
	role?: "status" | "alert";
	as?: "div" | "section" | "aside";
}>) {
	return (
		<Component
			role={role}
			className={cn(
				"px-5 py-5 md:px-7 md:py-6 border",
				tone === "plain" && "border-border bg-card",
				tone === "sealed" && "border-dashed border-border bg-sealed",
				tone === "caution" && "border-warning bg-card",
				className,
			)}
		>
			{title && <p className="font-display text-letter text-foreground">{title}</p>}
			{children && (
				<div className={cn("text-body text-muted-foreground", title && "mt-1.5")}>
					{children}
				</div>
			)}
			{actions && (
				<div className="mt-4 gap-x-5 gap-y-2 flex flex-wrap items-center">{actions}</div>
			)}
		</Component>
	);
}
