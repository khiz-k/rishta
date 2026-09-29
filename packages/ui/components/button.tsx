import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../lib";
import { Spinner } from "./spinner";

/**
 * Square, flat buttons (design.md §9). Primary is the lac-seal fill and is the only action
 * colour; secondary is an ink fill; outline is a 1px ink border; ghost is text only.
 * Heights: 44px default, 56px for bars and the family link. `sm` is 36px only in the dense
 * desktop margin (lg and up); below that it keeps the 44px touch target. Links keep a 44px minimum.
 */
const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 font-sans text-button ui-semi whitespace-nowrap transition-colors duration-150 select-none enabled:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:opacity-50 [&>svg]:size-5 [&>svg]:shrink-0",
	{
		variants: {
			variant: {
				primary: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary",
				outline:
					"border border-foreground bg-transparent text-foreground hover:bg-accent active:bg-accent",
				ghost: "bg-transparent text-foreground hover:bg-accent active:bg-accent",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive",
				link: "text-seal-ink underline-offset-4 hover:underline",
			},
			size: {
				sm: "h-11 lg:h-9 px-3 text-ui",
				md: "h-11 px-5",
				lg: "h-14 px-6",
				icon: "size-11 p-0",
			},
		},
		compoundVariants: [
			{
				// A link still gets a 44px target (design.md §14): the Pass slip's 6-second Undo is
				// the one time-limited action in the reader, and it is used one-handed.
				variant: "link",
				className: "h-auto min-h-11 px-0",
			},
		],
		defaultVariants: {
			variant: "secondary",
			size: "md",
		},
	},
);

export type ButtonProps = {
	asChild?: boolean;
	loading?: boolean;
	ref?: React.Ref<HTMLButtonElement>;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants>;

const Button = ({
	className,
	children,
	variant,
	size,
	asChild = false,
	loading,
	disabled,
	...props
}: ButtonProps) => {
	const Comp = asChild ? SlotPrimitive.Slot : "button";
	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			disabled={disabled || loading}
			aria-busy={loading || undefined}
			{...props}
		>
			{loading && <Spinner className="text-inherit" />}
			<SlotPrimitive.Slottable>{children}</SlotPrimitive.Slottable>
		</Comp>
	);
};

export { Button, buttonVariants };
