import { type CSSProperties, useId } from "react";

import { cn } from "../../lib";

/**
 * The monogram seal (design.md §6, §11): the one curve in the product.
 * - pending: a 1px ink outline and a dashed rim (a sealed section waiting, a note not yet sent)
 * - pressed: a lac disc, a marigold rim and paper initials
 * - broken: two halves along a drawn crack, rotated ∓8° and parted 6px (both seals break at once)
 *
 * Motion lives in CSS (apps/saas globals): `pressing` plays the 220ms press with the ink
 * spreading from the centre; `breaking` plays the 320ms break. prefers-reduced-motion swaps both
 * for the end state instantly. While the seal is held (`holding`), the seal itself is the
 * progress: there is no ring or gauge around it, the wax takes the ink.
 */
export type SealState = "pending" | "pressed" | "broken";

export interface MonogramSealProps {
	initials: string;
	state: SealState;
	/** design.md §11: 24, 40 and 64 (the seal you press). */
	size?: 24 | 40 | 64;
	/** Play the press (scale 1.04 → 1 and the ink spread). */
	pressing?: boolean;
	/** Play the break; without it a broken seal is simply shown broken. */
	breaking?: boolean;
	/**
	 * A seal ready to press sits at 85% ink; pressing spreads the rest from the centre. Without
	 * it (the default) a pressed seal is shown fully inked.
	 */
	awaitingPress?: boolean;
	/**
	 * The hold (design.md §6.2): the lac ink spreads from the centre out to the marigold rim,
	 * deepening the disc from 85% to full, as the hold's progress runs 0 → 1. The pressing
	 * control sets that progress each frame on an ancestor as `--seal-hold`, and, when a hold is
	 * let go early, `--seal-hold-return` (150ms) so the ink eases back instead of vanishing.
	 */
	holding?: boolean;
	/** Accessible name. Without it the seal is decorative (aria-hidden). */
	title?: string;
	className?: string;
}

const CRACK: Array<[number, number]> = [
	[32, 2],
	[29, 14],
	[35, 25],
	[28, 37],
	[34, 48],
	[30, 62],
];

const crackPoints = CRACK.map(([x, y]) => `${x},${y}`).join(" ");
const crackReversed = [...CRACK]
	.reverse()
	.map(([x, y]) => `${x},${y}`)
	.join(" ");
const crackPath = `M${CRACK.map(([x, y]) => `${x} ${y}`).join(" L")}`;

function initialsOf(value: string) {
	const letters = value
		.trim()
		.split(/\s+/)
		.map((part) => Array.from(part)[0] ?? "")
		.join("");
	return Array.from(letters).slice(0, 2).join("").toUpperCase();
}

/** The ink under a held seal: a full-lac disc scaled from the centre by the hold's progress. */
const HOLD_INK: CSSProperties = {
	transform: "scale(var(--seal-hold, 0))",
	transformBox: "fill-box",
	transformOrigin: "center",
	transition: "transform var(--seal-hold-return, 0ms) ease-out",
};

function SealFace({
	initials,
	inkClassName,
	inkStyle,
	fontSize,
	withInk = true,
}: {
	initials: string;
	inkClassName?: string;
	inkStyle?: CSSProperties;
	fontSize: number;
	withInk?: boolean;
}) {
	return (
		<>
			<circle cx="32" cy="32" r="29" fill="var(--seal)" opacity="0.85" />
			{withInk && (
				<circle
					cx="32"
					cy="32"
					r="29"
					fill="var(--seal)"
					className={inkClassName}
					style={inkStyle}
				/>
			)}
			<circle cx="32" cy="32" r="28" fill="none" stroke="var(--seal-rim)" strokeWidth="2" />
			<circle
				cx="32"
				cy="32"
				r="23.5"
				fill="none"
				stroke="var(--seal-rim)"
				strokeWidth="0.75"
				opacity="0.7"
			/>
			<text
				x="32"
				y="33.5"
				textAnchor="middle"
				dominantBaseline="central"
				fill="var(--primary-foreground)"
				fontFamily="var(--font-display)"
				fontSize={fontSize}
			>
				{initials}
			</text>
		</>
	);
}

export function MonogramSeal({
	initials: rawInitials,
	state,
	size = 64,
	pressing,
	breaking,
	awaitingPress,
	holding,
	title,
	className,
}: MonogramSealProps) {
	const id = useId().replace(/:/g, "");
	const initials = initialsOf(rawInitials) || "·";
	const fontSize = initials.length > 1 ? 21 : 26;
	const a11y = title ? { role: "img", "aria-label": title } : { "aria-hidden": true };

	return (
		<svg
			viewBox="-4 -4 72 72"
			width={size}
			height={size}
			className={cn("shrink-0 overflow-visible", className)}
			data-seal-state={state}
			{...a11y}
		>
			{state === "pending" && (
				<g>
					<circle
						cx="32"
						cy="32"
						r="29"
						fill="none"
						stroke="var(--foreground)"
						strokeWidth="1"
					/>
					<circle
						cx="32"
						cy="32"
						r="24.5"
						fill="none"
						stroke="var(--muted-foreground)"
						strokeWidth="1"
						strokeDasharray="2.5 3"
					/>
					<text
						x="32"
						y="33.5"
						textAnchor="middle"
						dominantBaseline="central"
						fill="var(--muted-foreground)"
						fontFamily="var(--font-display)"
						fontSize={fontSize}
					>
						{initials}
					</text>
				</g>
			)}

			{state === "pressed" && (
				<g
					className={cn(pressing && "animate-seal-press")}
					style={{ transformBox: "view-box", transformOrigin: "32px 32px" }}
				>
					<SealFace
						initials={initials}
						fontSize={fontSize}
						withInk={pressing || holding || !awaitingPress}
						// After a full hold the ink is already at the rim, so the press only settles.
						inkClassName={pressing && !holding ? "animate-ink-spread" : undefined}
						inkStyle={holding ? HOLD_INK : undefined}
					/>
				</g>
			)}

			{state === "broken" && (
				<>
					<defs>
						<clipPath id={`${id}-l`}>
							<polygon points={`-4,-4 32,-4 ${crackPoints} 30,68 -4,68`} />
						</clipPath>
						<clipPath id={`${id}-r`}>
							<polygon points={`32,-4 68,-4 68,68 30,68 ${crackReversed}`} />
						</clipPath>
					</defs>
					<g
						className={breaking ? "animate-seal-half-left" : undefined}
						style={{
							transformBox: "view-box",
							transformOrigin: "30px 62px",
							...(breaking ? {} : { transform: "translateX(-3px) rotate(-8deg)" }),
						}}
					>
						<g clipPath={`url(#${id}-l)`}>
							<SealFace initials={initials} fontSize={fontSize} />
						</g>
					</g>
					<g
						className={breaking ? "animate-seal-half-right" : undefined}
						style={{
							transformBox: "view-box",
							transformOrigin: "30px 62px",
							...(breaking ? {} : { transform: "translateX(3px) rotate(8deg)" }),
						}}
					>
						<g clipPath={`url(#${id}-r)`}>
							<SealFace initials={initials} fontSize={fontSize} />
						</g>
					</g>
					{breaking && (
						<path
							d={crackPath}
							fill="none"
							stroke="var(--card)"
							strokeWidth="1.25"
							strokeLinejoin="round"
							pathLength={1}
							strokeDasharray="1"
							className="animate-crack-draw"
						/>
					)}
				</>
			)}
		</svg>
	);
}

export { initialsOf as sealInitials };
