import { LOGO_MARK } from "@repo/ui/components/logo";
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * The app icon (design.md §11): the pressed monogram seal on paper, with the drawn "R" shared
 * with the logo. Neutral on a lock screen: no rings, no heart, no rose. ImageResponse cannot read
 * CSS variables, so these are the Paper values of --background, --seal and --seal-rim.
 */
export default function Icon() {
	const { viewBox, disc, rim, innerRing, strokes } = LOGO_MARK;
	const center = viewBox / 2;
	return new ImageResponse(
		<div
			style={{
				width: 32,
				height: 32,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#f5efe3",
			}}
		>
			<svg width={30} height={30} viewBox={`0 0 ${viewBox} ${viewBox}`}>
				<circle cx={center} cy={center} r={disc.r} fill="#933113" />
				<circle
					cx={center}
					cy={center}
					r={rim.r}
					fill="none"
					stroke="#c98a17"
					strokeWidth={rim.strokeWidth}
				/>
				<circle
					cx={center}
					cy={center}
					r={innerRing.r}
					fill="none"
					stroke="#c98a17"
					strokeWidth={innerRing.strokeWidth}
					opacity={innerRing.opacity}
				/>
				{strokes.map((stroke) => (
					<path
						key={stroke.d}
						d={stroke.d}
						fill="none"
						stroke="#ffffff"
						strokeWidth={stroke.width}
					/>
				))}
			</svg>
		</div>,
		{ ...size },
	);
}
