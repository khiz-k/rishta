"use client";

import { cn } from "@repo/ui";
import { SettingsItem } from "@shared/components/SettingsItem";
import { onRovingKeyDown, rovingTabIndex } from "@shared/lib/roving";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useIsClient } from "usehooks-ts";

const OPTIONS = ["light", "dark", "system"] as const;

/**
 * Appearance (design.md §5.13): Paper, Lamp (warm sepia for night reading) or Follow my phone,
 * the default. Family links are always Paper.
 */
export function AppearanceForm() {
	const t = useTranslations("settings.appearance");
	const { theme, setTheme } = useTheme();
	const isClient = useIsClient();
	const current = isClient ? (theme ?? "system") : null;
	const anySelected = OPTIONS.some((option) => option === current);

	return (
		<SettingsItem title={t("title")} description={t("description")}>
			<div
				role="radiogroup"
				aria-label={t("title")}
				onKeyDown={(event) => onRovingKeyDown(event)}
				className="grid grid-cols-3 border border-foreground"
			>
				{OPTIONS.map((option, index) => (
					<button
						key={option}
						type="button"
						role="radio"
						aria-checked={current === option}
						tabIndex={rovingTabIndex(current === option, index, anySelected)}
						onClick={() => setTheme(option)}
						className={cn(
							"min-h-11 px-2 font-semibold border-r border-foreground text-ui [font-stretch:87.5%] last:border-r-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
							current === option
								? "bg-secondary text-secondary-foreground"
								: "hover:bg-accent",
						)}
					>
						{t(option)}
					</button>
				))}
			</div>
			<p className="mt-3 text-meta text-muted-foreground">{t("note")}</p>
		</SettingsItem>
	);
}
