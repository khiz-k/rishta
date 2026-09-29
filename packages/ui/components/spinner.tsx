import { cn } from "../lib";

/**
 * Rishta has no spinners (design.md §10). A pending action shows a quiet, static ellipsis of
 * three ink squares beside its label; the control itself carries aria-busy.
 */
export function Spinner({ className }: { className?: string }) {
	return (
		<span aria-hidden="true" className={cn("inline-flex items-center gap-[3px]", className)}>
			<span className="size-[3px] bg-current opacity-90" />
			<span className="size-[3px] bg-current opacity-60" />
			<span className="size-[3px] bg-current opacity-30" />
		</span>
	);
}
