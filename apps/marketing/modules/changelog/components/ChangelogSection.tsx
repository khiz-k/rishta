import { getFormatter, getTranslations } from "next-intl/server";

interface ChangelogEntry {
	date: string;
	title: string;
	changes: string[];
}

/** What changed, in plain words: a dated ledger, newest first. */
export async function ChangelogSection() {
	const t = await getTranslations("changelog");
	const format = await getFormatter();
	const entries = t.raw("entries") as ChangelogEntry[];

	return (
		<section id="changelog">
			<ol className="border-t border-border">
				{entries.map((entry) => (
					<li
						key={entry.date}
						className="py-8 gap-x-8 gap-y-2 sm:grid-cols-[9rem_1fr] grid border-b border-border"
					>
						<p className="pt-1 label-caps text-muted-foreground tabular">
							<time dateTime={entry.date}>
								{format.dateTime(new Date(entry.date), { dateStyle: "medium" })}
							</time>
						</p>
						<div>
							<h2 className="font-display text-section text-foreground">
								{entry.title}
							</h2>
							<ul className="mt-3 space-y-1.5 text-body text-foreground">
								{entry.changes.map((change) => (
									<li key={change} className="gap-3 grid grid-cols-[0.75rem_1fr]">
										<span
											aria-hidden="true"
											className="w-3 mt-[0.8rem] h-px bg-foreground"
										/>
										<span>{change}</span>
									</li>
								))}
							</ul>
						</div>
					</li>
				))}
			</ol>
		</section>
	);
}
