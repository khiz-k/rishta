"use client";

import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../lib";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogClose = DialogPrimitive.Close;

const DialogPortal = ({ ...props }: DialogPrimitive.DialogPortalProps) => (
	<DialogPrimitive.Portal {...props} />
);

/** A flat scrim: no backdrop blur. */
const DialogOverlay = ({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) => (
	<DialogPrimitive.Overlay
		className={cn(
			"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 inset-0 data-[state=closed]:animate-out data-[state=open]:animate-in fixed z-50 bg-scrim data-[state=closed]:duration-[120ms] data-[state=open]:duration-[180ms]",
			className,
		)}
		{...props}
	/>
);

/** A square sheet of paper with the double rule at its head. */
const DialogContent = ({
	className,
	children,
	hideClose,
	closeLabel = "Close",
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
	hideClose?: boolean;
	closeLabel?: string;
}) => (
	<DialogPortal>
		<DialogOverlay />
		<DialogPrimitive.Content
			className={cn(
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 max-w-lg gap-4 px-5 pt-6 pb-5 md:px-7 data-[state=closed]:animate-out data-[state=open]:animate-in fixed top-1/2 left-1/2 z-50 grid max-h-[90dvh] w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-border bg-popover text-popover-foreground data-[state=closed]:duration-[120ms] data-[state=open]:duration-[180ms]",
				"before:inset-x-0 before:top-0 before:absolute before:double-rule before:content-['']",
				className,
			)}
			{...props}
		>
			{children}
			{!hideClose && (
				<DialogPrimitive.Close className="top-2 right-2 size-11 absolute inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none">
					<XIcon className="size-5" />
					<span className="sr-only">{closeLabel}</span>
				</DialogPrimitive.Close>
			)}
		</DialogPrimitive.Content>
	</DialogPortal>
);

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("gap-1 pr-10 flex flex-col text-left", className)} {...props} />
);

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn("gap-2 sm:flex-row sm:justify-end flex flex-col-reverse", className)}
		{...props}
	/>
);

const DialogTitle = ({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) => (
	<DialogPrimitive.Title className={cn("font-display text-section", className)} {...props} />
);

const DialogDescription = ({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) => (
	<DialogPrimitive.Description
		className={cn("text-body text-muted-foreground", className)}
		{...props}
	/>
);

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
};
