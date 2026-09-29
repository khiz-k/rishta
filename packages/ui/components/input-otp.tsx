"use client";

import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../lib";

function InputOTP({
	className,
	containerClassName,
	...props
}: React.ComponentProps<typeof OTPInput> & {
	containerClassName?: string;
}) {
	return (
		<OTPInput
			data-slot="input-otp"
			containerClassName={cn(
				"gap-2 flex items-center has-disabled:opacity-50",
				containerClassName,
			)}
			className={cn("disabled:cursor-not-allowed", className)}
			{...props}
		/>
	);
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="input-otp-group"
			className={cn("flex items-center", className)}
			{...props}
		/>
	);
}

function InputOTPSlot({
	index,
	className,
	...props
}: React.ComponentProps<"div"> & {
	index: number;
}) {
	const inputOTPContext = React.useContext(OTPInputContext);
	const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

	return (
		<div
			data-slot="input-otp-slot"
			data-active={isActive}
			className={cn(
				"h-11 w-11 relative flex items-center justify-center border-y border-r border-input bg-card text-body transition-colors outline-none first:border-l aria-invalid:border-destructive data-[active=true]:z-10 data-[active=true]:outline-2 data-[active=true]:outline-offset-0 data-[active=true]:outline-ring data-[active=true]:outline-solid data-[active=true]:aria-invalid:outline-destructive",
				className,
			)}
			{...props}
		>
			{char}
			{hasFakeCaret && (
				<div className="inset-0 pointer-events-none absolute flex items-center justify-center">
					<div className="animate-caret-blink h-4 w-px bg-foreground duration-1000 motion-reduce:animate-none" />
				</div>
			)}
		</div>
	);
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
	return (
		<div data-slot="input-otp-separator" {...props}>
			<MinusIcon className="size-4" />
		</div>
	);
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
