"use client";

import { useHousehold } from "@household/components/HouseholdProvider";
import { PencilNoteForm, PencilNotesList } from "@household/components/PencilNotes";
import { Button } from "@repo/ui";
import { ResponsiveSheet } from "@shared/components/ResponsiveSheet";
import { ShareIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import type { ReaderItem } from "../lib/reader";
import { WhyReasons } from "./WhyReasons";

/**
 * Why this page (design.md §5.2): the plain reasons, gaps included, then the household's pencil
 * notes. On the phone it snaps to 50% and 90% height; on desktop the same list lives in the
 * margin column.
 */
export function WhyThisPageSheet({
	open,
	onOpenChange,
	item,
	name,
	focusPencil,
	onNotesChanged,
	onFamily,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	item: ReaderItem;
	name: string;
	focusPencil?: boolean;
	onNotesChanged: () => void;
	onFamily: () => void;
}) {
	const t = useTranslations("folio");
	const { abilities, slug } = useHousehold();

	if (!item.page) {
		return null;
	}

	return (
		<ResponsiveSheet
			open={open}
			onOpenChange={onOpenChange}
			title={t("why.title")}
			snapPoints={[0.5, 0.92]}
		>
			<div className="gap-8 flex flex-col">
				{!focusPencil && (
					<section>
						<WhyReasons reasons={item.reasons} name={name} />
						<p className="mt-4 text-meta text-muted-foreground">
							{t("why.footnote", { name })}
						</p>
						<Link
							href={`/${slug}/biodata/looking-for`}
							className="mt-1 min-h-11 inline-flex items-center text-ui text-seal-ink underline-offset-4 hover:underline"
						>
							{t("why.edit")} →
						</Link>
					</section>
				)}
				<section aria-labelledby="sheet-pencil">
					<h3 id="sheet-pencil" className="label-caps text-muted-foreground">
						{t("why.pencilTitle")}
					</h3>
					<PencilNotesList
						notes={item.pencilNotes}
						onChanged={onNotesChanged}
						className="mt-2"
					/>
					{abilities.canPencil && (
						<div className="mt-4">
							<PencilNoteForm handle={item.page.handle} onAdded={onNotesChanged} />
						</div>
					)}
				</section>
				{abilities.canShare && item.familyLinksAllowed && (
					<div>
						<Button variant="outline" onClick={onFamily}>
							<ShareIcon />
							{t("actions.family")}
						</Button>
					</div>
				)}
			</div>
		</ResponsiveSheet>
	);
}
