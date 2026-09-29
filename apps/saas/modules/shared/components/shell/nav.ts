"use client";

import { usePathname } from "next/navigation";

export type NavKey = "folio" | "letters" | "biodata";

export interface NavItem {
	key: NavKey;
	href: string;
	active: boolean;
}

/** Folio · Letters · My Biodata: the only three places (design.md §4). */
export function useNavItems(slug: string | null): NavItem[] {
	const pathname = usePathname() ?? "";
	if (!slug) {
		return [];
	}
	const base = `/${slug}`;
	const isFolio =
		pathname === base || pathname.startsWith(`${base}/folio`) || pathname.startsWith("/b/");
	const isLetters = pathname.startsWith(`${base}/letters`) || pathname.startsWith("/letters/");
	const isBiodata =
		pathname.startsWith(`${base}/biodata`) ||
		pathname.startsWith(`${base}/begin`) ||
		pathname.startsWith(`${base}/claim`);

	return [
		{ key: "folio", href: base, active: isFolio },
		{ key: "letters", href: `${base}/letters`, active: isLetters },
		{ key: "biodata", href: `${base}/biodata`, active: isBiodata },
	];
}
