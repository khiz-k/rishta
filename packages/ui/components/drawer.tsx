"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "../lib";

/**
 * The phone's sheet (vaul): square, 1px top edge with the double rule, a flat scrim and a
 * 240ms slide on the sheet easing. Used for Why this page, the seal composer, option lists and
 * the margin on small screens. Radix focus trap and return come with it.
 */
const Drawer = ({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
	<DrawerPrimitive.Root {...props} />
);

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = ({
	className,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) => (
	<DrawerPrimitive.Overlay className={cn("inset-0 fixed z-50 bg-scrim", className)} {...props} />
);

const DrawerContent = ({
	className,
	children,
	withHandle = true,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & { withHandle?: boolean }) => (
	<DrawerPortal>
		<DrawerOverlay />
		<DrawerPrimitive.Content
			className={cn(
				"inset-x-0 bottom-0 fixed z-50 flex max-h-[96dvh] flex-col border-t border-border bg-popover text-popover-foreground outline-none",
				className,
			)}
			{...props}
		>
			<div aria-hidden="true" className="double-rule shrink-0" />
			{withHandle && (
				<div aria-hidden="true" className="mt-2 flex shrink-0 justify-center">
					<span className="h-1 w-10 bg-border" />
				</div>
			)}
			{children}
		</DrawerPrimitive.Content>
	</DrawerPortal>
);

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("gap-1 px-5 pt-3 pb-2 flex flex-col text-left", className)} {...props} />
);

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("gap-2 p-5 mt-auto flex flex-col pb-safe", className)} {...props} />
);

const DrawerTitle = ({
	className,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) => (
	<DrawerPrimitive.Title className={cn("font-display text-section", className)} {...props} />
);

const DrawerDescription = ({
	className,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) => (
	<DrawerPrimitive.Description
		className={cn("text-body text-muted-foreground", className)}
		{...props}
	/>
);

export {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerOverlay,
	DrawerPortal,
	DrawerTitle,
	DrawerTrigger,
};
