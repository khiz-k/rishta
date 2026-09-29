import { FIT_KEYS, type FitKey, type FitReason } from "@repo/database";
import { z } from "zod";

import type { ServerCopy } from "../../../lib/copy";
import { findContactDetails } from "../../interests/lib/note-rules";
import { FIRST_LINE_SYSTEM_PROMPT } from "./prompts";
import { runStructured } from "./run";

/** A plain overlap between two pages that a first line may cite. */
export interface Overlap {
	key: FitKey;
	/** Which template to use: a fit key, or "region" for families from the same region. */
	kind:
		| "timeline"
		| "language"
		| "diet"
		| "religion"
		| "community"
		| "region"
		| "location"
		| "education";
	value?: string;
}

const PRIORITY: Overlap["kind"][] = [
	"timeline",
	"region",
	"language",
	"diet",
	"community",
	"religion",
	"location",
	"education",
];

function regionOf(nativePlace: string | null) {
	if (!nativePlace) {
		return null;
	}
	const parts = nativePlace
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean);
	return parts.length > 1 ? (parts[parts.length - 1] ?? null) : (parts[0] ?? null);
}

/**
 * The deterministic overlaps (the `fits` reasons plus shared regions) between the writer's page
 * and the page they are writing to, most meaningful first.
 */
export function collectOverlaps(params: {
	reasons: FitReason[];
	writerNativePlace: string | null;
	targetNativePlace: string | null;
}): Overlap[] {
	const overlaps: Overlap[] = [];

	for (const reason of params.reasons) {
		if (reason.verdict !== "fits") {
			continue;
		}
		switch (reason.key) {
			case "timeline":
				if (reason.params.same === "true") {
					overlaps.push({ key: "timeline", kind: "timeline", value: reason.params.mine });
				}
				break;
			case "language":
				overlaps.push({ key: "language", kind: "language", value: reason.params.language });
				break;
			case "diet":
				if (reason.params.theirs && reason.params.theirs === reason.params.mine) {
					overlaps.push({ key: "diet", kind: "diet", value: reason.params.theirs });
				}
				break;
			case "religion":
				overlaps.push({ key: "religion", kind: "religion" });
				break;
			case "community":
				if (reason.params.value) {
					overlaps.push({
						key: "community",
						kind: "community",
						value: reason.params.value,
					});
				}
				break;
			case "location":
				if (reason.params.basis === "same_city" && reason.params.readerCity) {
					overlaps.push({
						key: "location",
						kind: "location",
						value: reason.params.readerCity.split(",")[0]?.trim(),
					});
				}
				break;
			case "education":
				overlaps.push({ key: "education", kind: "education" });
				break;
			default:
				break;
		}
	}

	const writerRegion = regionOf(params.writerNativePlace);
	const targetRegion = regionOf(params.targetNativePlace);
	if (writerRegion && targetRegion && writerRegion.toLowerCase() === targetRegion.toLowerCase()) {
		overlaps.push({ key: "location", kind: "region", value: targetRegion });
	}

	return overlaps.sort((a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind));
}

function phrase(t: ServerCopy, overlap: Overlap) {
	switch (overlap.kind) {
		case "timeline":
			return t("firstLine.timeline", {
				timeline: t(`timelines.${(overlap.value ?? "1_year") as "1_year"}`),
			});
		case "language":
			return t("firstLine.language", { language: overlap.value ?? "" });
		case "diet":
			return t("firstLine.diet", { diet: t(`diets.${(overlap.value ?? "veg") as "veg"}`) });
		case "community":
			return t("firstLine.community", { community: overlap.value ?? "" });
		case "region":
			return t("firstLine.region", { region: overlap.value ?? "" });
		case "location":
			return t("firstLine.location", { city: overlap.value ?? "" });
		case "religion":
			return t("firstLine.religion");
		case "education":
			return t("firstLine.education");
	}
}

/** The no-AI fallback: an i18n template from the top one or two overlaps. */
export function templateFirstLine(t: ServerCopy, overlaps: Overlap[]) {
	const [first, second] = overlaps;
	if (!first) {
		return { line: t("firstLine.fallback"), basedOn: [] as FitKey[] };
	}
	if (!second) {
		return { line: t("firstLine.intro", { first: phrase(t, first) }), basedOn: [first.key] };
	}
	return {
		line: t("firstLine.introTwo", { first: phrase(t, first), second: phrase(t, second) }),
		basedOn: Array.from(new Set([first.key, second.key])),
	};
}

const LOOKS_OR_MONEY =
	/\b(?:beautiful|pretty|handsome|cute|gorgeous|hot|sexy|lovely eyes|smile|fair|slim|tall|salary|income|earn|rich|wealth|money|photo|picture|number|whatsapp|email)\b/i;

const FirstLineSchema = z.object({
	line: z.string().min(20).max(160),
	basedOn: z.array(z.enum(FIT_KEYS)).min(1).max(3),
});

/** An AI first line that cites only the given overlaps; null to fall back to the template. */
export async function aiFirstLine(params: {
	writerFirstName: string;
	readerFirstName: string;
	overlaps: Overlap[];
}) {
	if (params.overlaps.length === 0) {
		return null;
	}

	const facts = params.overlaps
		.map(
			(overlap) =>
				`- ${overlap.kind}${overlap.value ? `: ${overlap.value}` : ""} (key: ${overlap.key})`,
		)
		.join("\n");

	const result = await runStructured({
		name: "first_line",
		schema: FirstLineSchema,
		system: FIRST_LINE_SYSTEM_PROMPT,
		prompt: `Writer: ${params.writerFirstName}. Reader: ${params.readerFirstName}.\nOverlaps:\n${facts}`,
	});

	if (!result) {
		return null;
	}
	const allowed = new Set(params.overlaps.map((overlap) => overlap.key));
	if (
		LOOKS_OR_MONEY.test(result.line) ||
		findContactDetails(result.line) ||
		result.line.includes("!") ||
		!result.basedOn.every((key) => allowed.has(key))
	) {
		return null;
	}
	return result;
}
