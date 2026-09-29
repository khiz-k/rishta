import { Logo } from "@repo/ui";

import "./global.css";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Anek_Latin, Tiro_Devanagari_Hindi } from "next/font/google";

import { source } from "@/lib/source";

// The product's faces (design.md §8): Tiro for headings, Anek for reading and UI.
const tiro = Tiro_Devanagari_Hindi({
	weight: "400",
	style: ["normal", "italic"],
	subsets: ["latin", "latin-ext"],
	variable: "--font-tiro",
	display: "swap",
});

const anek = Anek_Latin({
	weight: "variable",
	axes: ["wdth"],
	subsets: ["latin", "latin-ext"],
	variable: "--font-anek",
	display: "swap",
});

// Per-page share images are relative (/og/...), so they need an absolute base in production.
// Same precedence as @repo/utils getBaseUrl: the docs URL, then the Vercel URL, then localhost.
const docsBaseUrl =
	process.env.NEXT_PUBLIC_DOCS_URL ??
	(process.env.NEXT_PUBLIC_VERCEL_URL
		? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
		: `http://localhost:${process.env.PORT ?? 3002}`);

export const metadata: Metadata = {
	metadataBase: new URL(docsBaseUrl),
	title: {
		default: "Rishta help",
		template: "%s · Rishta help",
	},
	description:
		"How Rishta works: your folio, sealed notes, letters and introductions, family links and households, privacy and safety.",
};

export default function Layout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" className={`${tiro.variable} ${anek.variable}`} suppressHydrationWarning>
			<body className="flex min-h-screen flex-col">
				<RootProvider theme={{ defaultTheme: "light" }}>
					<DocsLayout
						tree={source.getPageTree()}
						nav={{
							title: <Logo variant="lockup" />,
						}}
					>
						{children}
					</DocsLayout>
				</RootProvider>
			</body>
		</html>
	);
}
