import { LOGO_MARK } from "@repo/ui/components/logo";

/**
 * The seal mark for ImageResponse (icons and share images), which cannot read CSS variables:
 * the Paper values of --seal, --seal-rim and --primary-foreground (tooling/tailwind/theme.css).
 */
export const PAPER = {
	desk: "#f5efe3",
	page: "#fffbf3",
	ink: "#1f1b16",
	muted: "#5e554a",
	border: "#cdbfa6",
	seal: "#933113",
	rim: "#c98a17",
	sealText: "#ffffff",
} as const;

export function SealMarkImage({ size }: { size: number }) {
	const { viewBox, disc, rim, innerRing, strokes } = LOGO_MARK;
	const center = viewBox / 2;
	return (
		<svg width={size} height={size} viewBox={`0 0 ${viewBox} ${viewBox}`}>
			<circle cx={center} cy={center} r={disc.r} fill={PAPER.seal} />
			<circle
				cx={center}
				cy={center}
				r={rim.r}
				fill="none"
				stroke={PAPER.rim}
				strokeWidth={rim.strokeWidth}
			/>
			<circle
				cx={center}
				cy={center}
				r={innerRing.r}
				fill="none"
				stroke={PAPER.rim}
				strokeWidth={innerRing.strokeWidth}
				opacity={innerRing.opacity}
			/>
			{strokes.map((stroke) => (
				<path
					key={stroke.d}
					d={stroke.d}
					fill="none"
					stroke={PAPER.sealText}
					strokeWidth={stroke.width}
				/>
			))}
		</svg>
	);
}
