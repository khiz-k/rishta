import { Link, Text } from "@react-email/components";
import React from "react";

import { paper } from "./paper";

/** The plain address under a button, for mail clients that block buttons. */
export default function LinkFallback({ label, href }: { label: string; href: string }) {
	return (
		<Text
			className="mt-6 mb-0"
			style={{ fontSize: 13, lineHeight: "20px", color: paper.muted }}
		>
			{label}
			<br />
			<Link href={href} style={{ color: paper.seal, wordBreak: "break-all" }}>
				{href}
			</Link>
		</Text>
	);
}
