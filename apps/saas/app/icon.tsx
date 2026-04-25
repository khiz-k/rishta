import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
	return new ImageResponse(
		<div
			style={{
				width: 32,
				height: 32,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#9f1239",
				borderRadius: 8,
			}}
		>
			<svg width="22" height="22" viewBox="0 0 48 48" fill="none">
				<circle cx="17" cy="24" r="10" stroke="white" strokeWidth="3" fill="none" opacity="0.8" />
				<circle cx="31" cy="24" r="10" stroke="white" strokeWidth="3" fill="none" opacity="0.9" />
			</svg>
		</div>,
		{ ...size },
	);
}
