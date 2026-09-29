"use client";

import type { LetterSummary } from "@shared/lib/api-types";
import { daysSince, formatShortDate, formatSlotDay, formatTime } from "@shared/lib/format";
import { useLocale, useTranslations } from "next-intl";
import { useCallback } from "react";

/**
 * A letter's state in words (design.md §5.4, §5.6): "Waiting · 12 days", "Choose a time",
 * "Call booked Thu 8:00 pm", "Closed kindly on 3 Oct". Never an icon or a colour alone.
 */
export function useLetterWords() {
	const t = useTranslations("letters.state");
	const locale = useLocale();

	return useCallback(
		(letter: LetterSummary) => {
			const age = daysSince(letter.createdAt);
			const intro = letter.introduction;
			switch (letter.state) {
				case "waiting_for_you":
					return age === 0 ? t("waitingToday") : t("waitingDays", { count: age });
				case "waiting_for_them":
					return age === 0 ? t("sealedToday") : t("sealedDays", { count: age });
				case "introduced":
					if (intro && !intro.sealsSeen) {
						return t("sealsBroke");
					}
					if (intro && intro.unread > 0) {
						return t("newWords", { count: intro.unread });
					}
					return intro?.yourMove ? t("chooseTime") : t("introduced");
				case "call_booked":
					return intro?.bookedSlot
						? t("callBooked", {
								when: `${formatSlotDay(intro.bookedSlot, locale)} ${formatTime(intro.bookedSlot, locale)}`,
							})
						: t("callBookedNoTime");
				case "families":
					return t("families");
				case "introduction_closed":
					return t("closedKindly", { date: formatShortDate(letter.updatedAt, locale) });
				case "declined_by_you":
					return t("declinedByYou");
				case "declined_by_them":
					return letter.declineMode === "kind_note"
						? t("declinedKindly")
						: t("closedQuietly");
				case "withdrawn_by_you":
					return t("withdrawnByYou");
				case "withdrawn_by_them":
					return t("withdrawnByThem");
				case "expired":
					return t("expired");
				case "closed":
					return t("closed");
			}
		},
		[t, locale],
	);
}
