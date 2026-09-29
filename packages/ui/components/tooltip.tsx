"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../lib";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = ({
	className,
	sideOffset = 4,
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) => (
	<TooltipPrimitive.Content
		sideOffset={sideOffset}
		className={cn(
			"fade-in-0 data-[state=closed]:fade-out-0 animate-in px-2 py-1 data-[state=closed]:animate-out z-50 overflow-hidden border border-border bg-popover text-meta text-popover-foreground",
			className,
		)}
		{...props}
	/>
);

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
