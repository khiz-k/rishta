import { cn } from "../lib";

export function Logo({ withLabel = true, className }: { className?: string; withLabel?: boolean }) {
	return (
		<span
			className={cn(
				"font-semibold flex items-center leading-none text-foreground",
				className,
			)}
		>
			<svg className="size-9 text-primary" viewBox="0 0 48 48" fill="none">
				<title>Vow</title>
				{/* Two interlocking rings */}
				<circle cx="18" cy="24" r="11" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.7" />
				<circle cx="30" cy="24" r="11" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.9" />
				{/* Sparkle at intersection */}
				<circle cx="24" cy="24" r="2.5" fill="currentColor" opacity="0.6" />
			</svg>
			{withLabel && <span className="ml-2 text-lg md:block hidden font-display tracking-tight">Vow</span>}
		</span>
	);
}
