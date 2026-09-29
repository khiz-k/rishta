import { PencilMark } from "@repo/ui";

import { FAMILY_LINK_SAMPLE as sample } from "../lib/sample-page";

/**
 * The family link on a plain phone outline (design.md §15.7): no browser chrome, no app, no
 * sign-in. The page at 130% in her language, and three square buttons under it.
 */
export function FamilyLinkFigure({ caption }: { caption: string }) {
	return (
		<figure className="mt-8 gap-8 sm:flex-row sm:items-end flex flex-col">
			<div
				aria-hidden="true"
				lang={sample.lang}
				className="p-2.5 pb-6 w-[272px] shrink-0 border border-foreground bg-background"
			>
				<div className="mb-2.5 h-1 w-10 mx-auto bg-foreground/70" />
				<div className="border border-border bg-card">
					<div className="px-3 py-2 border-b border-border bg-sealed">
						<p className="text-ref text-muted-foreground">{sample.strip}</p>
						<p className="text-ref text-muted-foreground">{sample.until}</p>
					</div>
					<div className="double-rule" />
					<div className="px-4 pt-4 pb-5">
						<p className="text-ref text-muted-foreground">{sample.translated}</p>
						<p className="mt-1 font-display text-title-sm text-foreground">
							{sample.name}
						</p>
						<p className="text-body text-foreground">{sample.meta}</p>
						<p className="mt-4 hairline-after font-display text-body text-foreground">
							{sample.section}
						</p>
						<dl className="mt-1.5">
							{sample.fields.map((field) => (
								<div key={field.label} className="py-1">
									<dt className="text-ref text-muted-foreground">
										{field.label}
									</dt>
									<dd className="text-body text-foreground">{field.value}</dd>
								</div>
							))}
						</dl>
						<p className="mt-4 font-display text-body text-foreground">
							{sample.question}
						</p>
						<div className="mt-2 gap-1.5 grid grid-cols-1">
							{sample.reactions.map((reaction) => (
								<div
									key={reaction.kind}
									className="h-11 px-3 gap-2 flex items-center border border-foreground text-ui ui-semi text-foreground"
								>
									<PencilMark kind={reaction.kind} className="text-foreground" />
									{reaction.label}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
			<figcaption className="max-w-xs pencil text-meta">{caption}</figcaption>
		</figure>
	);
}
