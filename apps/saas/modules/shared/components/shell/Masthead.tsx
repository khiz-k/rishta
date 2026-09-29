"use client";

import { Logo } from "@repo/ui";
import { cn } from "@repo/ui";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { AvatarTile } from "./AvatarTile";
import { LettersCount } from "./LettersCount";
import { useNavItems } from "./nav";
import { useShell } from "./ShellContext";

/**
 * Desktop and tablet (≥ 768px): a 48px masthead on the desk with a 1px rule below. The wordmark,
 * three text links in condensed caps (the active one underlined 2px in ink, flush with the rule)
 * and the avatar tile. No sidebar, no icons, no bell.
 */
export function Masthead({ slug }: { slug: string | null }) {
	const t = useTranslations("shell.nav");
	const items = useNavItems(slug);

	return (
		<header
			data-print-hide
			className="top-0 md:flex sticky z-40 hidden h-(--masthead-height) border-b border-border bg-background"
		>
			<div className="px-6 lg:px-10 mx-auto flex w-full max-w-[1440px] items-stretch">
				<Link
					href={slug ? `/${slug}` : "/"}
					className="mr-10 lg:mr-16 flex items-center focus-visible:outline-2 focus-visible:outline-ring"
				>
					<Logo />
				</Link>
				<nav aria-label={t("label")} className="gap-8 flex items-stretch">
					{items.map((item) => (
						<Link
							key={item.key}
							href={item.href}
							aria-current={item.active ? "page" : undefined}
							className={cn(
								"gap-2 -mb-px flex items-center border-b-2 nav-caps transition-colors focus-visible:outline-2 focus-visible:outline-ring",
								item.active
									? "border-foreground text-foreground"
									: "border-transparent text-muted-foreground hover:text-foreground",
							)}
						>
							{t(item.key)}
							{item.key === "letters" && <LettersCount />}
						</Link>
					))}
				</nav>
				<div className="ml-auto flex items-center">
					<AvatarTile />
				</div>
			</div>
		</header>
	);
}

/**
 * Phone (< 768px): a 44px top line with the wordmark, the screen's context ("Friday folio · 3 of
 * 7") and the avatar tile.
 */
export function TopLine({ slug, fallback }: { slug: string | null; fallback?: string }) {
	const shell = useShell();
	const context = shell?.contextLine ?? fallback ?? null;

	return (
		<header
			data-print-hide
			className="top-0 px-4 md:hidden gap-3 sticky z-40 flex h-(--topline-height) items-center border-b border-border bg-background"
		>
			<Link
				href={slug ? `/${slug}` : "/"}
				className="shrink-0 font-display text-section focus-visible:outline-2 focus-visible:outline-ring"
			>
				Rishta
			</Link>
			{context && (
				<p className="min-w-0 flex-1 truncate text-right text-meta text-muted-foreground tabular">
					{context}
				</p>
			)}
			<div className={cn("flex shrink-0 items-center", !context && "ml-auto")}>
				<AvatarTile />
			</div>
		</header>
	);
}
