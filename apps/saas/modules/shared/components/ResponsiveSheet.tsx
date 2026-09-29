"use client";

import {
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@repo/ui";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import { useTranslations } from "next-intl";
import type { PropsWithChildren, ReactNode } from "react";

/**
 * One sheet, two postures: a square Radix dialog on desktop and a vaul sheet from the bottom on
 * the phone (thumb reach). Both trap focus and return it; Esc closes and drafts are kept.
 */
export function ResponsiveSheet({
	open,
	onOpenChange,
	title,
	description,
	children,
	className,
	snapPoints,
	desktopClassName,
	dismissible = true,
}: PropsWithChildren<{
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: ReactNode;
	description?: ReactNode;
	className?: string;
	desktopClassName?: string;
	/** vaul snap points on the phone, e.g. [0.5, 0.9]. */
	snapPoints?: number[];
	dismissible?: boolean;
}>) {
	const t = useTranslations("common");
	const isDesktop = useMediaQuery("(min-width: 768px)");

	if (isDesktop) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent
					closeLabel={t("close")}
					className={cn("max-w-xl", desktopClassName)}
					onInteractOutside={dismissible ? undefined : (event) => event.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						{description ? (
							<DialogDescription>{description}</DialogDescription>
						) : (
							<DialogDescription className="sr-only">{title}</DialogDescription>
						)}
					</DialogHeader>
					<div className={className}>{children}</div>
				</DialogContent>
			</Dialog>
		);
	}

	const content = (
		<DrawerContent className={cn(snapPoints ? "h-[96dvh]" : "max-h-[92dvh]")}>
			<DrawerHeader>
				<DrawerTitle>{title}</DrawerTitle>
				{description ? (
					<DrawerDescription>{description}</DrawerDescription>
				) : (
					<DrawerDescription className="sr-only">{title}</DrawerDescription>
				)}
			</DrawerHeader>
			<div className={cn("px-5 pb-6 overflow-y-auto pb-safe", className)}>{children}</div>
		</DrawerContent>
	);

	return snapPoints ? (
		<Drawer
			open={open}
			onOpenChange={onOpenChange}
			snapPoints={snapPoints}
			fadeFromIndex={0}
			dismissible={dismissible}
			repositionInputs
		>
			{content}
		</Drawer>
	) : (
		<Drawer open={open} onOpenChange={onOpenChange} dismissible={dismissible} repositionInputs>
			{content}
		</Drawer>
	);
}
