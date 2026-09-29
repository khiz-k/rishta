import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type React from "react";

import { cn } from "../lib";

/**
 * A disclosed label in condensed caps with a 1px border (PRIORITY NOTE, a status word).
 * Square, never a pill, and colour is never the only signal: the words carry the meaning.
 */
export const badge = cva(
	[
		"inline-flex",
		"items-center",
		"gap-1",
		"border",
		"px-1.5",
		"py-0.5",
		"label-caps",
		"whitespace-nowrap",
	],
	{
		variants: {
			status: {
				success: ["border-success", "text-success"],
				info: ["border-seal-ink", "text-seal-ink"],
				warning: ["border-warning", "text-warning"],
				error: ["border-destructive", "text-destructive"],
				neutral: ["border-border", "text-muted-foreground"],
			},
		},
		defaultVariants: {
			status: "info",
		},
	},
);

export type BadgeProps = React.HtmlHTMLAttributes<HTMLDivElement> & VariantProps<typeof badge>;

export const Badge = ({ children, className, status, ...props }: BadgeProps) => (
	<span className={cn(badge({ status }), className)} {...props}>
		{children}
	</span>
);

Badge.displayName = "Badge";
