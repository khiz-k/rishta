"use client";

import { Popover as PopoverPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../lib";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = ({
	className,
	align = "center",
	sideOffset = 4,
	...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) => (
	<PopoverPrimitive.Portal>
		<PopoverPrimitive.Content
			align={align}
			sideOffset={sideOffset}
			className={cn(
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 w-72 p-4 data-[state=closed]:animate-out data-[state=open]:animate-in z-50 border border-border bg-popover text-popover-foreground outline-hidden data-[state=closed]:duration-[120ms] data-[state=open]:duration-[180ms]",
				className,
			)}
			{...props}
		/>
	</PopoverPrimitive.Portal>
);

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
