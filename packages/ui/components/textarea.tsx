import * as React from "react";

import { cn } from "../lib";

/** A square writing surface with a 1px --input boundary. Letters use it in Tiro. */
const Textarea = ({ className, ...props }: React.ComponentProps<"textarea">) => {
	return (
		<textarea
			className={cn(
				"px-3 py-2 flex min-h-[88px] w-full border border-input bg-card text-body text-foreground placeholder:text-pencil placeholder:italic focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
				className,
			)}
			{...props}
		/>
	);
};

export { Textarea };
