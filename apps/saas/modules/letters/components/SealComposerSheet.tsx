"use client";

import { ResponsiveSheet } from "@shared/components/ResponsiveSheet";
import { useTranslations } from "next-intl";

import { SealComposer } from "./SealComposer";

/**
 * The composer on the phone and tablet: a sheet (90% height on the phone) so the page stays
 * underneath. Esc or a swipe down closes it and the draft is kept.
 */
export function SealComposerSheet({
	open,
	onOpenChange,
	handle,
	recipientFirstName,
	onSent,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	handle: string;
	recipientFirstName: string;
	onSent: (letterId: string) => void;
}) {
	const t = useTranslations("composer");
	return (
		<ResponsiveSheet
			open={open}
			onOpenChange={onOpenChange}
			title={t("title", { name: recipientFirstName })}
			snapPoints={[0.92]}
		>
			{open && (
				<SealComposer
					handle={handle}
					recipientFirstName={recipientFirstName}
					variant="sheet"
					onClose={() => onOpenChange(false)}
					onSent={onSent}
				/>
			)}
		</ResponsiveSheet>
	);
}
