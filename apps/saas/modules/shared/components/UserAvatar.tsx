import { cn } from "@repo/ui";

/**
 * A square tile with initials in Tiro (design.md §4.1): never a circle and never a photo, so a
 * glance over a shoulder never shows a face.
 */
export const UserAvatar = ({
	name,
	className,
}: {
	name: string;
	avatarUrl?: string | null;
	className?: string;
}) => {
	const initials = name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => Array.from(part)[0] ?? "")
		.join("")
		.toUpperCase();

	return (
		<span
			aria-hidden="true"
			className={cn(
				"size-8 inline-flex shrink-0 items-center justify-center border border-foreground/70 bg-card font-display text-ui text-foreground",
				className,
			)}
		>
			{initials || "·"}
		</span>
	);
};
