import type { ReactNode } from "react";

/**
 * The head of a long-form page (Safety, Notes, a legal page): a dateline in condensed caps, the
 * title in Tiro and an optional lead, over a double marigold rule. Left-aligned, like a letter.
 */
export function LetterHead({
	dateline,
	title,
	lead,
	children,
}: {
	dateline?: string;
	title: string;
	lead?: string;
	children?: ReactNode;
}) {
	return (
		<header className="pb-10">
			{dateline && <p className="label-caps text-muted-foreground">{dateline}</p>}
			<h1 className="mt-3 md:text-[2.5rem] md:leading-[3rem] font-display text-title text-balance text-foreground">
				{title}
			</h1>
			{lead && <p className="mt-4 text-[1.1875rem] leading-[1.875rem] text-pretty">{lead}</p>}
			{children}
			<div aria-hidden="true" className="mt-10 double-rule" />
		</header>
	);
}
