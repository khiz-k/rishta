import { PAPER, SealMarkImage } from "@shared/components/SealMarkImage";
import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** The favicon: the pressed seal on paper, the same mark as the app icon. */
export default function Icon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: PAPER.desk,
			}}
		>
			<SealMarkImage size={60} />
		</div>,
		{ ...size },
	);
}
