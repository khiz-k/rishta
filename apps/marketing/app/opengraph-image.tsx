import messages from "@repo/i18n/translations/en/marketing.json";
import { PAPER, SealMarkImage } from "@shared/components/SealMarkImage";
import { ImageResponse } from "next/og";

// The share image is one file for every locale, so it is set in the default language.
const copy = messages.metadata;

export const alt = copy.shareAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share image families see when a link is forwarded on WhatsApp: one page on the desk, the
 * double marigold rule, the wordmark and the promise. No photo, no couple, no heart.
 */
export default function OpengraphImage() {
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
			<div
				style={{
					width: 980,
					height: 470,
					display: "flex",
					flexDirection: "column",
					background: PAPER.page,
					border: `2px solid ${PAPER.border}`,
					boxShadow: `6px 6px 0 -2px ${PAPER.page}, 6px 6px 0 0 ${PAPER.border}`,
				}}
			>
				<div
					style={{
						display: "flex",
						height: 8,
						borderTop: `2px solid ${PAPER.rim}`,
						borderBottom: `2px solid ${PAPER.rim}`,
					}}
				/>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						flex: 1,
						padding: "56px 72px",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: 22 }}>
						<SealMarkImage size={76} />
						<div
							style={{
								display: "flex",
								fontSize: 64,
								color: PAPER.ink,
								fontFamily: "serif",
							}}
						>
							Rishta
						</div>
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
						<div
							style={{
								display: "flex",
								fontSize: 54,
								lineHeight: 1.15,
								color: PAPER.ink,
								fontFamily: "serif",
							}}
						>
							{copy.shareTitle}
						</div>
						<div style={{ display: "flex", fontSize: 28, color: PAPER.muted }}>
							{copy.shareLine}
						</div>
					</div>
				</div>
			</div>
		</div>,
		{ ...size },
	);
}
