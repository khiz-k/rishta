import { cn } from "../../lib";

/**
 * The invocation line at the head of a page (design.md §11). Text invocations are set in their
 * own script fonts; the cross and the khanda are drawn, because no font carries them well.
 */
export type InvocationKind =
	| "om"
	| "shri_ganesh"
	| "bismillah"
	| "ik_onkar"
	| "cross"
	| "khanda"
	| "custom";

export const INVOCATION_TEXT: Partial<
	Record<InvocationKind, { text: string; lang: string; dir?: "rtl" }>
> = {
	om: { text: "ॐ", lang: "hi" },
	shri_ganesh: { text: "॥ श्री गणेशाय नमः ॥", lang: "hi" },
	bismillah: { text: "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ", lang: "ur", dir: "rtl" },
	ik_onkar: { text: "ੴ", lang: "pa" },
};

/**
 * The drawn invocations as SVG path data, shared with anything that draws the page elsewhere
 * (the page image export uses them through Path2D).
 */
export const INVOCATION_PATHS = {
	cross: { viewBox: [24, 32], strokeWidth: 1.5, paths: ["M12 2v28M4 10h16"], circles: [] },
	khanda: {
		viewBox: [40, 40],
		strokeWidth: 1.25,
		paths: [
			"M20 3v25M17.5 7.5 20 3l2.5 4.5",
			"M11 10c-6 6-5.5 16 2.5 21.5M29 10c6 6 5.5 16-2.5 21.5",
			"M13.5 31.5l-2 3.5M26.5 31.5l2 3.5M17 31h6",
		],
		circles: [[20, 20, 7.5]],
	},
} as const satisfies Record<
	"cross" | "khanda",
	{
		viewBox: readonly [number, number];
		strokeWidth: number;
		paths: readonly string[];
		circles: ReadonlyArray<readonly [number, number, number]>;
	}
>;

/** The text form of an invocation (null for the drawn ones or an empty custom line). */
export function invocationText(kind: InvocationKind, text?: string) {
	if (kind === "custom") {
		return text ? { text, lang: undefined, dir: undefined } : null;
	}
	const entry = INVOCATION_TEXT[kind];
	return entry ? { text: entry.text, lang: entry.lang, dir: entry.dir } : null;
}

export function InvocationGlyph({
	kind,
	text,
	className,
}: {
	kind: InvocationKind;
	text?: string;
	className?: string;
}) {
	if (kind === "cross" || kind === "khanda") {
		const glyph = INVOCATION_PATHS[kind];
		const [width, height] = glyph.viewBox;
		return (
			<svg
				viewBox={`0 0 ${width} ${height}`}
				aria-hidden="true"
				className={cn(
					"text-foreground",
					kind === "cross" ? "h-7 w-5" : "size-8",
					className,
				)}
				fill="none"
				stroke="currentColor"
				strokeWidth={glyph.strokeWidth}
				strokeLinecap={kind === "khanda" ? "round" : undefined}
			>
				{glyph.paths.map((d) => (
					<path key={d} d={d} />
				))}
				{glyph.circles.map(([cx, cy, r]) => (
					<circle key={`${cx}-${cy}-${r}`} cx={cx} cy={cy} r={r} />
				))}
			</svg>
		);
	}

	const entry = invocationText(kind, text);
	if (!entry) {
		return null;
	}

	return (
		<span
			lang={entry.lang}
			dir={entry.dir}
			className={cn("font-display text-section text-foreground", className)}
		>
			{entry.text}
		</span>
	);
}
