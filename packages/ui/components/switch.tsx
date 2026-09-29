"use client";

import { CheckIcon } from "lucide-react";
import { Switch as SwitchPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../lib";

/**
 * Rishta has no switch pills. The Switch API stays for the template screens, but it renders as
 * a square box with an ink tick when on (role="switch" is kept for assistive tech).
 */
const Switch = ({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) => (
	<SwitchPrimitive.Root
		className={cn(
			"peer group size-5 inline-flex shrink-0 cursor-pointer items-center justify-center border border-input bg-card text-secondary-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-secondary data-[state=checked]:bg-secondary",
			className,
		)}
		{...props}
	>
		<SwitchPrimitive.Thumb className="pointer-events-none flex items-center justify-center opacity-0 data-[state=checked]:opacity-100">
			<CheckIcon className="size-4" strokeWidth={2.25} />
		</SwitchPrimitive.Thumb>
	</SwitchPrimitive.Root>
);

Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
