"use client";

import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../lib";
import { buttonVariants } from "./button";

/** The square confirm step that replaces every window.confirm(). */
const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = ({
	className,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) => (
	<AlertDialogPrimitive.Overlay
		className={cn(
			"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 inset-0 data-[state=closed]:animate-out data-[state=open]:animate-in fixed z-50 bg-scrim",
			className,
		)}
		{...props}
	/>
);

const AlertDialogContent = ({
	className,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) => (
	<AlertDialogPortal>
		<AlertDialogOverlay />
		<AlertDialogPrimitive.Content
			className={cn(
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 max-w-md gap-4 px-5 pt-6 pb-5 md:px-7 data-[state=closed]:animate-out data-[state=open]:animate-in fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 border border-border bg-popover text-popover-foreground data-[state=closed]:duration-[120ms] data-[state=open]:duration-[180ms]",
				"before:inset-x-0 before:top-0 before:absolute before:double-rule before:content-['']",
				className,
			)}
			{...props}
		/>
	</AlertDialogPortal>
);

const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("gap-2 flex flex-col text-left", className)} {...props} />
);

const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn("gap-2 sm:flex-row sm:justify-end flex flex-col-reverse", className)}
		{...props}
	/>
);

const AlertDialogTitle = ({
	className,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) => (
	<AlertDialogPrimitive.Title className={cn("font-display text-section", className)} {...props} />
);

const AlertDialogDescription = ({
	className,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) => (
	<AlertDialogPrimitive.Description
		className={cn("text-body text-muted-foreground", className)}
		{...props}
	/>
);

const AlertDialogAction = ({
	className,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) => (
	<AlertDialogPrimitive.Action className={cn(buttonVariants(), className)} {...props} />
);

const AlertDialogCancel = ({
	className,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) => (
	<AlertDialogPrimitive.Cancel
		className={cn(buttonVariants({ variant: "ghost" }), className)}
		{...props}
	/>
);

export {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	AlertDialogPortal,
	AlertDialogTitle,
	AlertDialogTrigger,
};
