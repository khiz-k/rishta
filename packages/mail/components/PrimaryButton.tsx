import { Button } from "@react-email/components";
import React, { type PropsWithChildren } from "react";

import { fonts, paper } from "./paper";

/** The one action: a square lac-seal button, 44px tall, label first and no arrow. */
export default function PrimaryButton({
	href,
	children,
}: PropsWithChildren<{
	href: string;
}>) {
	return (
		<Button
			href={href}
			style={{
				backgroundColor: paper.seal,
				color: paper.onSeal,
				fontFamily: fonts.sans,
				fontSize: 16,
				fontWeight: 600,
				lineHeight: "20px",
				padding: "12px 22px",
				borderRadius: 0,
				textDecoration: "none",
			}}
		>
			{children}
		</Button>
	);
}
