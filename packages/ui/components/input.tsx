import React from "react";

import { cn } from "../lib";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** A square field with a 1px --input boundary (>= 3:1), 44px tall, on the page surface. */
const Input = ({ className, type, ...props }: InputProps) => {
	return (
		<input
			type={type}
			className={cn(
				"h-11 px-3 file:font-medium flex w-full border border-input bg-card text-body text-foreground transition-colors file:border-0 file:bg-transparent file:text-meta placeholder:text-pencil placeholder:italic focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
				className,
			)}
			{...props}
		/>
	);
};

export { Input };
