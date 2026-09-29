"use client";

import type { PassReason } from "@repo/database/drizzle/domain";
import { Button, cn } from "@repo/ui";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { PASS_REASON_OPTIONS } from "../lib/reader";

const UNDO_MS = 6000;

/**
 * "Passed quietly. Undo" for 6 seconds, with "Add a private reason" (design.md §5.1). The
 * reason is never shown to anyone else. The undo stays reachable afterwards in "Passed pages".
 */
export function PassSlip({
	name,
	onUndo,
	onReason,
	onDismiss,
}: {
	name: string;
	onUndo: () => void;
	onReason: (reason: PassReason) => void;
	onDismiss: () => void;
}) {
	const t = useTranslations("folio.pass");
	const [choosing, setChoosing] = useState(false);
	const [chosen, setChosen] = useState<PassReason | null>(null);
	const timer = useRef<number | null>(null);

	useEffect(() => {
		if (choosing) {
			if (timer.current) {
				window.clearTimeout(timer.current);
			}
			return;
		}
		timer.current = window.setTimeout(onDismiss, chosen ? 2000 : UNDO_MS);
		return () => {
			if (timer.current) {
				window.clearTimeout(timer.current);
			}
		};
	}, [choosing, chosen, onDismiss]);

	return (
		<div
			role="status"
			data-print-hide
			className="animate-slip-in px-4 py-3 max-w-md w-full border border-foreground/60 bg-popover text-popover-foreground"
		>
			<div className="gap-x-5 gap-y-1 flex flex-wrap items-center">
				<p className="mr-auto font-display text-letter">
					{chosen ? t("reasonKept") : t("slip", { name })}
				</p>
				{!chosen && (
					<>
						<Button variant="link" size="sm" onClick={onUndo}>
							{t("undo")}
						</Button>
						{!choosing && (
							<Button
								variant="link"
								size="sm"
								className="text-muted-foreground"
								onClick={() => setChoosing(true)}
							>
								{t("addReason")}
							</Button>
						)}
					</>
				)}
			</div>
			{choosing && !chosen && (
				<fieldset className="mt-3">
					<legend className="sr-only">{t("addReason")}</legend>
					<div className="gap-2 flex flex-wrap">
						{PASS_REASON_OPTIONS.map((reason) => (
							<button
								key={reason}
								type="button"
								onClick={() => {
									setChosen(reason);
									setChoosing(false);
									onReason(reason);
								}}
								className={cn(
									"min-h-11 px-3 border border-border bg-card text-ui transition-colors hover:border-foreground focus-visible:outline-2 focus-visible:outline-ring",
								)}
							>
								{t(`reasons.${reason}`)}
							</button>
						))}
					</div>
					<p className="mt-2 text-meta text-muted-foreground">{t("private")}</p>
				</fieldset>
			)}
		</div>
	);
}
