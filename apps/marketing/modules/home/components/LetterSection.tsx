import { cn } from "@repo/ui";
import type { PropsWithChildren } from "react";

/**
 * One passage of the founders' letter. Its side-head (condensed caps) sits in the left margin on
 * wide screens, the way an editor pencils a heading beside a paragraph, and above it on phones.
 */
export function LetterSection({
	id,
	heading,
	children,
	className,
}: PropsWithChildren<{ id: string; heading: string; className?: string }>) {
	return (
		<section
			id={id}
			aria-labelledby={`${id}-heading`}
			className={cn("mt-16 relative", className)}
		>
			<h2
				id={`${id}-heading`}
				className="xl:absolute xl:top-[0.45rem] xl:right-full xl:mr-10 xl:w-40 xl:text-right label-caps text-muted-foreground"
			>
				{heading}
			</h2>
			<div className="mt-4 xl:mt-0 space-y-5">{children}</div>
		</section>
	);
}

/** A paragraph of the letter: Tiro 18/28, ink on the desk. */
export function LetterParagraph({
	children,
	className,
}: PropsWithChildren<{ className?: string }>) {
	return (
		<p className={cn("font-display text-letter text-pretty text-foreground", className)}>
			{children}
		</p>
	);
}
