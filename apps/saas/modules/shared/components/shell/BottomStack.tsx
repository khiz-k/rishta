"use client";

import { cn } from "@repo/ui";
import { useReducedMotion } from "@shared/hooks/use-reduced-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { LettersCount } from "./LettersCount";
import { useNavItems } from "./nav";
import { useShell } from "./ShellContext";

/**
 * The phone's bottom stack (design.md §4.2): a reader's bars (portalled into the slot) above the
 * 56px text-only BottomBar. While the reader scrolls down the BottomBar slides away (180ms) and
 * the MarginBar settles to the bottom edge; the stack hides entirely while the keyboard is open.
 */
export function BottomStack({
	slug,
	withBottomBar,
}: {
	slug: string | null;
	withBottomBar: boolean;
}) {
	const shell = useShell();
	const reducedMotion = useReducedMotion();
	// Reduced motion: the BottomBar stays where it is rather than sliding away (design.md §10).
	const hidden = !reducedMotion && (shell?.chromeHidden ?? false);
	const keyboardOpen = shell?.keyboardOpen ?? false;

	return (
		<div
			data-print-hide
			data-motion="slide"
			className={cn(
				"inset-x-0 bottom-0 fixed z-40 transition-transform duration-(--dur-turn) ease-paper",
				keyboardOpen && "pointer-events-none translate-y-full opacity-0",
				!keyboardOpen &&
					hidden &&
					withBottomBar &&
					"max-md:translate-y-[calc(var(--bar-height)+env(safe-area-inset-bottom))]",
			)}
		>
			<div ref={shell?.registerSlot} />
			{withBottomBar && <BottomBar slug={slug} />}
		</div>
	);
}

function BottomBar({ slug }: { slug: string | null }) {
	const t = useTranslations("shell.nav");
	const items = useNavItems(slug);

	if (items.length === 0) {
		return null;
	}

	return (
		<nav
			aria-label={t("label")}
			className="md:hidden grid grid-cols-3 border-t border-border bg-background pb-safe"
		>
			{items.map((item) => (
				<Link
					key={item.key}
					href={item.href}
					aria-current={item.active ? "page" : undefined}
					className={cn(
						"gap-1.5 font-semibold flex h-(--bar-height) items-center justify-center border-t-2 text-ui [font-stretch:87.5%] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
						item.active
							? "-mt-px border-foreground text-foreground"
							: "-mt-px border-transparent text-muted-foreground",
					)}
				>
					{t(`${item.key}Short`)}
					{item.key === "letters" && <LettersCount />}
				</Link>
			))}
		</nav>
	);
}
