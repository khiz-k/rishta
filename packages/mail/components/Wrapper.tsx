import {
	Body,
	Column,
	Container,
	Head,
	Html,
	Preview,
	Row,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import React, { type PropsWithChildren } from "react";

import { fonts, paper } from "./paper";

/**
 * Every Rishta email: one page of paper on the parchment desk, the seal and wordmark at the
 * head, the double marigold rule, square corners, ink type. The footer says what the email is
 * and never names anyone.
 */
export default function Wrapper({
	children,
	preview,
	footer,
	lang = "en",
}: PropsWithChildren<{ preview?: string; footer?: string; lang?: string }>) {
	return (
		<Tailwind
			config={{
				theme: {
					extend: {
						colors: {
							border: paper.border,
							input: paper.input,
							background: paper.desk,
							foreground: paper.ink,
							primary: {
								DEFAULT: paper.seal,
								foreground: paper.onSeal,
							},
							secondary: {
								DEFAULT: paper.ink,
								foreground: paper.page,
							},
							muted: {
								DEFAULT: paper.sealed,
								foreground: paper.muted,
							},
							card: {
								DEFAULT: paper.page,
								foreground: paper.ink,
							},
						},
						borderRadius: {
							DEFAULT: "0",
							sm: "0",
							md: "0",
							lg: "0",
							xl: "0",
							"2xl": "0",
						},
					},
				},
			}}
		>
			<Html lang={lang}>
				<Head />
				{preview ? <Preview>{preview}</Preview> : null}
				<Body
					className="m-0 bg-background"
					style={{ fontFamily: fonts.sans, color: paper.ink }}
				>
					<Section className="px-3 py-8">
						<Container
							className="bg-card"
							style={{ maxWidth: 560, border: `1px solid ${paper.border}` }}
						>
							{/* The double marigold rule: 1px, a 2px gap, 1px. */}
							<div
								data-skip-in-text={true}
								style={{
									borderTop: `1px solid ${paper.rim}`,
									borderBottom: `1px solid ${paper.rim}`,
									height: 2,
									lineHeight: "2px",
									fontSize: 2,
								}}
							>
								&nbsp;
							</div>
							<Section className="px-8 pt-7">
								<Row>
									<Column style={{ width: 42 }}>
										<div
											data-skip-in-text={true}
											aria-hidden="true"
											style={{
												width: 28,
												height: 28,
												borderRadius: "50%",
												backgroundColor: paper.seal,
												border: `2px solid ${paper.rim}`,
												color: paper.onSeal,
												fontFamily: fonts.display,
												fontSize: 16,
												lineHeight: "28px",
												textAlign: "center",
											}}
										>
											R
										</div>
									</Column>
									<Column>
										<Text
											className="m-0"
											style={{
												fontFamily: fonts.display,
												fontSize: 24,
												lineHeight: "28px",
												color: paper.ink,
											}}
										>
											Rishta
										</Text>
									</Column>
								</Row>
							</Section>
							<Section className="px-8 pt-2 pb-8">{children}</Section>
						</Container>
						{footer ? (
							<Container style={{ maxWidth: 560 }}>
								<Text
									className="px-8 m-0 mt-4"
									style={{ fontSize: 13, lineHeight: "20px", color: paper.muted }}
								>
									{footer}
								</Text>
							</Container>
						) : null}
					</Section>
				</Body>
			</Html>
		</Tailwind>
	);
}

/** A heading in Tiro: never bold (Tiro has one weight). */
export function MailHeading({ children }: PropsWithChildren) {
	return (
		<Text
			className="mt-6 mb-2"
			style={{
				fontFamily: fonts.display,
				fontSize: 26,
				lineHeight: "32px",
				fontWeight: 400,
				color: paper.ink,
			}}
		>
			{children}
		</Text>
	);
}

/** Body copy: 16/26 in ink. */
export function MailText({ children, muted }: PropsWithChildren<{ muted?: boolean }>) {
	return (
		<Text
			className="my-4"
			style={{
				fontSize: muted ? 13 : 16,
				lineHeight: muted ? "20px" : "26px",
				color: muted ? paper.muted : paper.ink,
				whiteSpace: "pre-line",
			}}
		>
			{children}
		</Text>
	);
}
