"use client";

import { Avatar as AvatarPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../lib";

const Avatar = ({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) => (
	<AvatarPrimitive.Root
		className={cn(
			"size-8 relative flex shrink-0 overflow-hidden border border-border",
			className,
		)}
		{...props}
	/>
);

const AvatarImage = ({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) => (
	<AvatarPrimitive.Image
		className={cn("aspect-square size-full object-cover", className)}
		{...props}
	/>
);

const AvatarFallback = ({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) => (
	<AvatarPrimitive.Fallback
		className={cn(
			"flex size-full items-center justify-center bg-card font-display text-ui",
			className,
		)}
		{...props}
	/>
);

export { Avatar, AvatarFallback, AvatarImage };
