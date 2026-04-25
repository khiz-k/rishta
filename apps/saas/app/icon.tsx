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
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
				<path
					d="M12 21S3 14 3 8.5C3 5 6 2 9.5 2C11 2 12.5 3 12 4.5C11.5 3 13 2 14.5 2C18 2 21 5 21 8.5C21 14 12 21 12 21Z"
					fill="white"
					opacity="0.9"
				/>
			</svg>
		</div>,
		{ ...size },
	);
}
