"use client";

import { mdxComponents } from "@blog/lib/mdx-components";
import { MDXContent } from "@content-collections/mdx/react";
import { cn } from "@repo/ui";

/** Long-form content in ink on paper. `letter` sets it in Tiro, as a Note is a letter. */
export function PostContent({ content, letter }: { content: string; letter?: boolean }) {
	return (
		<div className={cn("prose max-w-none", letter && "prose-letter")}>
			<MDXContent
				code={content}
				components={{
					a: mdxComponents.a,
				}}
			/>
		</div>
	);
}
