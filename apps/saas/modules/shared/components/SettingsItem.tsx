import { cn } from "@repo/ui";
import type { PropsWithChildren, ReactNode } from "react";

/**
 * One settings block on paper (design.md §5.13): a Tiro heading and a line of explanation
 * beside the controls on wide screens, stacked on the phone. Flat, square, a 1px edge; the
 * danger tone changes the words' colour only, never the paper.
 */
export function SettingsItem({
	children,
	title,
	description,
	danger,
}: PropsWithChildren<{
	title: string | ReactNode;
	description?: string | ReactNode;
	danger?: boolean;
}>) {
	return (
		<section className="@container border border-border bg-card">
			<div className="gap-4 px-5 py-5 md:px-6 @2xl:grid @2xl:grid-cols-[min(100%/3,300px)_1fr] @2xl:gap-8 flex flex-col">
				<div>
					<h2
						className={cn(
							"font-display text-section",
							danger ? "text-destructive" : "text-foreground",
						)}
					>
						{title}
					</h2>
					{description && (
						<div className="mt-1 text-meta text-muted-foreground">{description}</div>
					)}
				</div>
				<div className="min-w-0">{children}</div>
			</div>
		</section>
	);
}
