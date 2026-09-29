"use client";

import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { XIcon } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../lib";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = ({ ...props }: SheetPrimitive.DialogPortalProps) => (
	<SheetPrimitive.Portal {...props} />
);

const SheetOverlay = ({
	className,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) => (
	<SheetPrimitive.Overlay
		className={cn(
			"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 inset-0 data-[state=closed]:animate-out data-[state=open]:animate-in fixed z-50 bg-scrim",
			className,
		)}
		{...props}
	/>
);

/** Square paper sheets that slide in 240ms on the sheet easing. */
const sheetVariants = cva(
	"fixed z-50 gap-4 bg-popover p-5 text-popover-foreground ease-sheet data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-[120ms] data-[state=open]:duration-[240ms]",
	{
		variants: {
			side: {
				top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
				bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
				left: "inset-y-0 left-0 h-full w-5/6 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
				right: "inset-y-0 right-0 h-full w-5/6 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
			},
		},
		defaultVariants: {
			side: "right",
		},
	},
);

type SheetContentProps = {
	closeLabel?: string;
} & React.ComponentProps<typeof SheetPrimitive.Content> &
	VariantProps<typeof sheetVariants>;

const SheetContent = ({
	side = "right",
	className,
	children,
	closeLabel = "Close",
	...props
}: SheetContentProps) => (
	<SheetPortal>
		<SheetOverlay />
		<SheetPrimitive.Content className={sheetVariants({ side, className })} {...props}>
			{children}
			<SheetPrimitive.Close className="top-2 right-2 size-11 absolute inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none">
				<XIcon className="size-5" />
				<span className="sr-only">{closeLabel}</span>
			</SheetPrimitive.Close>
		</SheetPrimitive.Content>
	</SheetPortal>
);

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("gap-1 pr-10 flex flex-col text-left", className)} {...props} />
);

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn("gap-2 sm:flex-row sm:justify-end flex flex-col-reverse", className)}
		{...props}
	/>
);

const SheetTitle = ({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) => (
	<SheetPrimitive.Title
		className={cn("font-display text-section text-foreground", className)}
		{...props}
	/>
);

const SheetDescription = ({
	className,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) => (
	<SheetPrimitive.Description
		className={cn("text-body text-muted-foreground", className)}
		{...props}
	/>
);

export {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
};
