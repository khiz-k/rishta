"use client";

import { cn } from "@repo/ui";
import { useShellContextLine } from "@shared/components/shell/ShellContext";
import { useTranslations } from "next-intl";
import { useSelectedLayoutSegment } from "next/navigation";
import type { PropsWithChildren } from "react";

import { LetterList } from "./LetterList";

/**
 * Letters on desktop: two columns, the list (360px) and the open letter beside its page. On the
 * phone, one column: the list, or the open letter.
 */
export function LettersFrame({ children }: PropsWithChildren) {
	const t = useTranslations("letters");
	const segment = useSelectedLayoutSegment();
	const open = Boolean(segment);

	useShellContextLine(open ? undefined : t("title"));

	return (
		<div className="lg:grid lg:min-h-[calc(100dvh-var(--masthead-height))] lg:grid-cols-[360px_1fr] mx-auto max-w-[1440px]">
			<aside
				aria-label={t("title")}
				className={cn("lg:border-r lg:block border-border", open ? "hidden" : "block")}
			>
				<div className="lg:sticky lg:top-(--masthead-height) lg:max-h-[calc(100dvh-var(--masthead-height))] lg:overflow-y-auto">
					<h1 className="sr-only">{t("title")}</h1>
					<LetterList />
				</div>
			</aside>
			<div className={cn("min-w-0", open ? "block" : "lg:block hidden")}>{children}</div>
		</div>
	);
}
