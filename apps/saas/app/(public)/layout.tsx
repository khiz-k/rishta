import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

/** Family links need no account: no session, no shell, never indexed, always Paper. */
export const metadata: Metadata = {
	robots: { index: false, follow: false, nocache: true },
	referrer: "no-referrer",
};

export default function PublicLayout({ children }: PropsWithChildren) {
	return <div className="paper-only">{children}</div>;
}
