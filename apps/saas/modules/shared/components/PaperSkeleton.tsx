import { cn } from "@repo/ui";

/**
 * The page outline while it loads (design.md §5.1): the double rule, a name block with the
 * photo box, and six hairline sections with faint label bars. It appears after 150ms so fast
 * loads never flash. No spinner and no shimmer.
 */
export function PaperSkeleton({
	className,
	sections = 6,
}: {
	className?: string;
	sections?: number;
}) {
	return (
		<div
			aria-hidden="true"
			className={cn(
				"animate-paper-appear mx-auto w-full max-w-(--page-width) border border-border bg-card",
				className,
			)}
		>
			<div className="double-rule" />
			<div className="pt-8 pb-10 page-pad">
				<div className="gap-5 grid grid-cols-[1fr_30%]">
					<div className="pt-1">
						<div className="h-8 w-3/5 bg-muted" />
						<div className="mt-3 h-4 w-2/5 bg-muted" />
						<div className="mt-2 h-3.5 w-1/3 bg-muted/70" />
					</div>
					<div className="aspect-[4/5] border border-border bg-veil/40" />
				</div>
				{Array.from({ length: sections }, (_, index) => (
					<div key={index} className="mt-8">
						<div className="gap-3 flex items-center">
							<div className="h-4 w-24 bg-muted" />
							<div className="h-px flex-1 bg-border" />
						</div>
						<div className="mt-4 gap-3 grid grid-cols-[7.5rem_1fr]">
							<div className="h-2.5 w-16 bg-muted/70" />
							<div className="h-3.5 w-3/5 bg-muted" />
							<div className="h-2.5 w-20 bg-muted/70" />
							<div className="h-3.5 w-2/5 bg-muted" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/** Hairline row skeletons for lists (letters, readers): static, no pulse. */
export function RowsSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
	return (
		<div aria-hidden="true" className={cn("animate-paper-appear", className)}>
			{Array.from({ length: rows }, (_, index) => (
				<div key={index} className="py-4 border-b border-border">
					<div className="h-4 w-2/5 bg-muted" />
					<div className="mt-2 h-3 w-3/5 bg-muted/70" />
				</div>
			))}
		</div>
	);
}
