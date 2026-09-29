import { cn } from "../../lib";

/**
 * Pencil-drawn marks for family reactions (design.md §11): a tick for Proceed, a question mark
 * for Let's talk and a strike for Not for us. Always shown with the words, never alone.
 */
export type PencilMarkKind = "proceed" | "lets_talk" | "not_for_us";

export function PencilMark({ kind, className }: { kind: PencilMarkKind; className?: string }) {
	return (
		<svg
			viewBox="0 0 20 20"
			aria-hidden="true"
			className={cn("size-4 shrink-0 text-pencil", className)}
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			{kind === "proceed" && (
				<path d="M3.5 10.8c1.4 1.1 2.6 2.4 3.6 4 2.4-4.6 5.4-8 9.3-10.3" />
			)}
			{kind === "lets_talk" && (
				<>
					<path d="M6.6 6.9c.3-2 1.8-3.2 3.7-3.1 2 .1 3.4 1.5 3.2 3.3-.2 1.6-1.4 2.3-2.5 3-.8.5-1.1 1.2-1.1 2.3" />
					<path d="M9.9 15.9h.1" />
				</>
			)}
			{kind === "not_for_us" && <path d="M3 10.6c4.6-.5 9.3-.9 14-1.1" />}
		</svg>
	);
}
