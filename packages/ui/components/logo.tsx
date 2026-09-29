import { cn } from "../lib";

/**
 * The Rishta mark: a pressed lac seal with a drawn "R" (design.md §11). The R is drawn rather than
 * typed, so the mark reads the same in the app, the docs, the app icon and the share image, with
 * or without the Tiro font. These paths are shared with the ImageResponse icons.
 */
export const LOGO_MARK = {
	viewBox: 64,
	disc: { r: 30 },
	rim: { r: 28.25, strokeWidth: 2.5 },
	innerRing: { r: 23, strokeWidth: 1, opacity: 0.7 },
	strokes: [
		// the stem
		{ d: "M25 19V45", width: 4 },
		// the bowl
		{
			d: "M25 19.75H32.5C37.8 19.75 41 22.6 41 26.6C41 30.6 37.8 33.4 32.5 33.4H25",
			width: 2.6,
		},
		// the leg
		{ d: "M31 33.4L40.6 44.6", width: 3.2 },
		// the serifs
		{ d: "M20.5 19H26M20.5 45H29.5M37.4 45H44.5", width: 1.75 },
	],
} as const;

export type LogoVariant = "wordmark" | "lockup" | "mark";

export interface LogoProps {
	/**
	 * - `wordmark`: "Rishta" in Tiro, alone (the app masthead; design.md §4.1)
	 * - `lockup`: the seal pressed beside the wordmark (marketing, sign-in, docs)
	 * - `mark`: the seal alone (the app icon's shape)
	 */
	variant?: LogoVariant;
	/** Older call sites: `withLabel={false}` is the mark. */
	withLabel?: boolean;
	className?: string;
}

/** The seal alone. Colours come from the tokens, so it follows Paper and Lamp. */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
	const { viewBox, disc, rim, innerRing, strokes } = LOGO_MARK;
	const center = viewBox / 2;
	const a11y = title ? { role: "img", "aria-label": title } : { "aria-hidden": true };

	return (
		<svg
			viewBox={`0 0 ${viewBox} ${viewBox}`}
			className={cn("size-8 shrink-0", className)}
			{...a11y}
		>
			<circle cx={center} cy={center} r={disc.r} fill="var(--seal)" />
			<circle
				cx={center}
				cy={center}
				r={rim.r}
				fill="none"
				stroke="var(--seal-rim)"
				strokeWidth={rim.strokeWidth}
			/>
			<circle
				cx={center}
				cy={center}
				r={innerRing.r}
				fill="none"
				stroke="var(--seal-rim)"
				strokeWidth={innerRing.strokeWidth}
				opacity={innerRing.opacity}
			/>
			{strokes.map((stroke) => (
				<path
					key={stroke.d}
					d={stroke.d}
					fill="none"
					stroke="var(--primary-foreground)"
					strokeWidth={stroke.width}
					strokeLinejoin="miter"
				/>
			))}
		</svg>
	);
}

/**
 * The wordmark: "Rishta" in Tiro Devanagari Hindi, ink on paper. No rings, no hearts, no rose.
 * The lockup presses the seal beside it, the way a letter is closed.
 */
export function Logo({ variant, withLabel = true, className }: LogoProps) {
	const resolved: LogoVariant = variant ?? (withLabel ? "wordmark" : "mark");

	if (resolved === "mark") {
		return (
			<span className={cn("inline-flex items-center", className)}>
				<LogoMark title="Rishta" />
			</span>
		);
	}

	return (
		<span
			className={cn(
				"inline-flex items-center gap-[0.4em] font-display text-wordmark leading-none text-foreground",
				className,
			)}
		>
			{resolved === "lockup" && <LogoMark className="size-[1.2em]" />}
			<span className={cn(resolved === "lockup" && "translate-y-[0.06em]")}>Rishta</span>
		</span>
	);
}
