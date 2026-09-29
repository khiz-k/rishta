"use client";

import { Progress as ProgressPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../lib";

const Progress = ({
	className,
	value,
	...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) => (
	<ProgressPrimitive.Root
		className={cn("h-1 relative w-full overflow-hidden bg-border", className)}
		{...props}
	>
		<ProgressPrimitive.Indicator
			className="size-full flex-1 bg-foreground transition-transform motion-reduce:transition-none"
			style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
		/>
	</ProgressPrimitive.Root>
);

export { Progress };
