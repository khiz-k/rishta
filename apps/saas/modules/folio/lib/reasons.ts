"use client";

import type { FitReason } from "@shared/lib/api-types";
import { cityOf, formatHeight } from "@shared/lib/format";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

/** A diet word mid-sentence: lower-case first letter, except proper nouns ("Jain vegetarian"). */
function inSentence(value: string | undefined, word: string) {
	if (!word || value === "jain_veg") {
		return word;
	}
	return word.charAt(0).toLocaleLowerCase() + word.slice(1);
}

/**
 * "Why this page" in plain words (design.md §5.2): each deterministic fit reason from the
 * server becomes one sentence, gaps included. Never a score, never a percentage.
 */
export function useReasonText() {
	const t = useTranslations("why");
	const tv = useTranslations("page.values");

	const timeline = useCallback(
		(value: string | undefined) => {
			const path = `timeline.${value ?? ""}` as Parameters<typeof t>[0];
			return value && t.has(path) ? t(path) : "";
		},
		[t],
	);

	const valueWord = useCallback(
		(field: "diet" | "religion" | "education" | "maritalStatus", value: string | undefined) => {
			if (!value) {
				return "";
			}
			const path = `${field}.${value}` as Parameters<typeof tv>[0];
			return tv.has(path) ? tv(path) : value;
		},
		[tv],
	);

	return useCallback(
		(reason: FitReason, name: string) => {
			const p = reason.params;
			const v = reason.verdict;
			switch (reason.key) {
				case "timeline": {
					if (v === "unknown") {
						return t("unknown.timeline", { name });
					}
					const mine = timeline(p.mine);
					const theirs = timeline(p.theirs);
					if (v === "fits" && p.same === "true") {
						return t("fits.timelineSame", { when: mine });
					}
					return t(v === "fits" ? "fits.timelineNear" : "gap.timeline", {
						name,
						theirs,
						mine,
					});
				}
				case "religion":
					if (v === "unknown") {
						return t("unknown.religion", { name });
					}
					return p.value
						? t(v === "fits" ? "fits.religionValue" : "gap.religionValue", {
								value: valueWord("religion", p.value),
							})
						: t(v === "fits" ? "fits.religion" : "gap.religion");
				case "diet": {
					const theirs = inSentence(p.theirs, valueWord("diet", p.theirs));
					const mine = inSentence(p.mine, valueWord("diet", p.mine));
					if (v === "fits") {
						return p.theirs === p.mine
							? t("fits.dietSame", { name, diet: theirs })
							: t("fits.diet", { name, diet: theirs });
					}
					return t("gap.diet", { name, theirs, mine });
				}
				case "age":
					if (v === "unknown") {
						return t("unknown.age", { name });
					}
					return t(v === "fits" ? "fits.age" : "gap.age", { name, age: p.age ?? "" });
				case "marital_status":
					return t(v === "fits" ? "fits.maritalStatus" : "gap.maritalStatus", {
						status: valueWord("maritalStatus", p.status),
					});
				case "location": {
					const city = cityOf(p.readerCity) ?? "";
					if (v === "unknown") {
						return t("unknown.location", { name });
					}
					switch (p.basis) {
						case "place":
							return t("fits.locationPlace", { name });
						case "they_relocate":
							return city
								? t("fits.locationTheyRelocate", { name, city })
								: t("fits.locationTheyRelocateNoCity", { name });
						case "you_relocate":
							return t("fits.locationYouRelocate");
						case "same_city":
							return t("fits.locationSameCity", { city });
						case "same_country":
							return t("fits.locationSameCountry");
						case "different_country":
							return t("gap.locationDifferentCountry", { name });
						default:
							return t("gap.locationDifferentCity");
					}
				}
				case "residency":
					if (v === "unknown") {
						return t("unknown.residency", { name });
					}
					return t(v === "fits" ? "fits.residency" : "gap.residency");
				case "education":
					if (v === "unknown") {
						return t("unknown.education", { name });
					}
					return p.value
						? t(v === "fits" ? "fits.educationValue" : "gap.educationValue", {
								value: valueWord("education", p.value),
							})
						: t(v === "fits" ? "fits.education" : "gap.education");
				case "community":
					if (v === "unknown") {
						return t("unknown.community", { name });
					}
					return p.value
						? t(v === "fits" ? "fits.communityValue" : "gap.communityValue", {
								value: p.value,
							})
						: t(v === "fits" ? "fits.community" : "gap.community");
				case "language":
					return t("fits.language", { language: p.language ?? "" });
				case "height": {
					if (v === "unknown") {
						return t("unknown.height", { name });
					}
					const cm = Number(p.heightCm);
					const height = Number.isFinite(cm) ? formatHeight(cm) : "";
					return t(v === "fits" ? "fits.height" : "gap.height", { height });
				}
			}
		},
		[t, timeline, valueWord],
	);
}
