import type { ReactNode } from "react";

/**
 * The head of a sign-in sheet: a condensed-caps overline, the title in Tiro (one weight, never
 * bold) and a line in the discreet-friend voice.
 */
export function AuthHeading({
	overline,
	title,
	lead,
}: {
	overline?: string;
	title: string;
	lead?: ReactNode;
}) {
	return (
		<div className="mb-7">
			{overline && <p className="mb-2 label-caps text-muted-foreground">{overline}</p>}
			<h1 className="md:text-title font-display text-title-sm tracking-[-0.005em] text-balance text-foreground">
				{title}
			</h1>
			{lead && <p className="mt-2 text-body text-pretty text-muted-foreground">{lead}</p>}
		</div>
	);
}
