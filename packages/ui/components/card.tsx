import * as React from "react";

import { cn } from "../lib";

/**
 * A sheet of paper: the page surface with a 1px edge, no radius and no shadow. Used for
 * settings blocks and slips, never as a grid of people.
 */
const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn("border border-border bg-card text-card-foreground", className)}
		{...props}
	/>
);

const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("gap-1 p-5 pb-3 md:p-6 md:pb-3 flex flex-col", className)} {...props} />
);

const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
	// oxlint-disable-next-line jsx_a11y/heading-has-content
	<h3 className={cn("font-display text-section", className)} {...props} />
);

const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
	<p className={cn("text-meta text-muted-foreground", className)} {...props} />
);

const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("p-5 pt-0 md:p-6 md:pt-0", className)} {...props} />
);

const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("p-5 pt-0 md:p-6 md:pt-0 flex items-center", className)} {...props} />
);

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
