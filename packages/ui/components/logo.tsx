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
				<title>Rishta</title>
				{/* Background */}
				<circle cx="24" cy="24" r="24" fill="currentColor" opacity="0.1" />
				{/* Heart */}
				<path
					d="M24 38S10 28 10 19C10 14 14 10 19 10C21.5 10 23.5 11.5 24 13C24.5 11.5 26.5 10 29 10C34 10 38 14 38 19C38 28 24 38 24 38Z"
					fill="currentColor"
					opacity="0.85"
				/>
				{/* Inner sparkle */}
				<circle cx="20" cy="18" r="2" fill="white" opacity="0.4" />
			</svg>
			{withLabel && <span className="ml-2.5 text-lg md:block hidden font-display tracking-tight">Rishta</span>}
		</span>
	);
}
