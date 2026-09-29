import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib";

const alertVariants = cva(
	"relative w-full border p-4 text-body [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4 [&>svg]:size-5 [&>svg]:text-foreground [&>svg~*]:pl-7",
	{
		variants: {
			variant: {
				default: "border-border bg-card text-foreground",
				primary: "border-seal-ink bg-card text-foreground [&>svg]:text-seal-ink",
				error: "border-destructive bg-card text-destructive [&>svg]:text-destructive",
				success: "border-success bg-card text-foreground [&>svg]:text-success",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

const Alert = ({
	className,
	variant,
	...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) => (
	<div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
);

const AlertTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
	// oxlint-disable-next-line jsx_a11y/heading-has-content
	<h5 className={cn("font-display text-section", className)} {...props} />
);

const AlertDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
	<div className={cn("mt-1 text-body", className)} {...props} />
);

export { Alert, AlertDescription, AlertTitle };
