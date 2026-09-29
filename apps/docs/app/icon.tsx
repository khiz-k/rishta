import { LOGO_MARK } from "@repo/ui/components/logo";
import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** The pressed seal on paper (the Paper values of --seal, --seal-rim and the desk). */
export default function Icon() {
	const { viewBox, disc, rim, innerRing, strokes } = LOGO_MARK;
	const center = viewBox / 2;
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#f5efe3",
			}}
		>
			<svg width={60} height={60} viewBox={`0 0 ${viewBox} ${viewBox}`}>
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
