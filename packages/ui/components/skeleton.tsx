import { cn } from "../lib";

/**
 * A faint, static bar in the shape of what will arrive. It appears after 150ms (so fast loads
 * never flash) and never pulses or shimmers.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div aria-hidden="true" className={cn("bg-muted", className)} {...props} />;
}

export { Skeleton };
