"use client";

import { CheckIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../lib";

/**
 * A square checkbox (design.md §9: square checkboxes, never switch pills). 20px box inside a
 * 44px hit area when wrapped in a label row; ink fill with a paper tick when checked.
 */
const Checkbox = ({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) => (
	<CheckboxPrimitive.Root
		className={cn(
			"peer size-5 inline-flex shrink-0 cursor-pointer items-center justify-center border border-input bg-card text-secondary-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-secondary data-[state=checked]:bg-secondary",
			className,
		)}
		{...props}
	>
		<CheckboxPrimitive.Indicator className="flex items-center justify-center">
			<CheckIcon className="size-4" strokeWidth={2.25} />
		</CheckboxPrimitive.Indicator>
	</CheckboxPrimitive.Root>
);

export { Checkbox };
