import type { BiodataPhotoRow, BiodataProfileRow } from "@repo/database";
// The domain module has no side effects (no DB client), so the redaction layer stays testable.
import {
	formatHandleRef,
	resolveFieldVisibility,
	type FieldVisibility,
	type VisibleField,
} from "@repo/database/drizzle/domain";

import { ageFromDateOfBirth, birthMonthYear } from "../../../lib/time";
import type { PageRelationship, PageView, SectionId } from "../types";
import { toPagePhotos } from "./photos";

export type PageWithPhotos = BiodataProfileRow & { photos: BiodataPhotoRow[] };

interface PageViewOptions {
	/** Inside an introduction: whether the page's candidate chose to share their phone. */
	phoneShared?: boolean;
	now?: Date;
}

/** Fields laid out in the document's own order (spec.md F4). */
const SECTION_FIELDS: Record<Exclude<SectionId, "about" | "looking_for">, VisibleField[]> = {
	personal: [
		"dateOfBirth",
		"height",
		"maritalStatus",
		"hasChildren",
		"motherTongue",
		"languages",
		"religion",
		"sect",
		"practice",
		"community",
		"residency",
		"manglik",
	],
	education: ["education", "university", "profession", "employer", "incomeRange"],
	family: [
		"fatherOccupation",
		"motherOccupation",
		"siblings",
		"familyType",
		"familyValues",
		"nativePlace",
	],
	lifestyle: ["diet", "smoking", "drinking"],
};

/** Always sealed, whatever the visibility map says: contact opens only with both seals. */
const ALWAYS_SEALED: readonly VisibleField[] = ["contactPhone"];

/** Horoscope details live in the sealed section when given. */
const SEALED_ORDER: VisibleField[] = [
	"fullName",
	"dateOfBirth",
	"employer",
	"incomeRange",
	"birthTime",
	"birthPlace",
	"contactPhone",
];

export function firstNameOf(displayName: string) {
	return displayName.trim().split(/\s+/)[0] ?? displayName;
}

function readField(page: BiodataProfileRow, field: VisibleField): string | string[] | null {
	const value = page[field];
	if (value === null || value === undefined) {
		return null;
	}
	if (Array.isArray(value)) {
		return value.length > 0 ? value : null;
	}
	if (typeof value === "boolean") {
		return value ? "yes" : "no";
	}
	const text = String(value).trim();
	return text.length > 0 ? text : null;
}

function visibilityOf(page: BiodataProfileRow, field: VisibleField): FieldVisibility {
	if (ALWAYS_SEALED.includes(field)) {
		return "sealed";
	}
	return resolveFieldVisibility(page.fieldVisibility, field);
}

/** Whether the reader sees a field in the open sections of the page. */
function isShownInSections(visibility: FieldVisibility, relationship: PageRelationship) {
	if (visibility === "page") {
		return true;
	}
	// The household sees matching-only fields on its own page (the UI marks them).
	return (
		visibility === "matching_only" && (relationship === "self" || relationship === "household")
	);
}

function isSealedOpen(relationship: PageRelationship) {
	return relationship === "self" || relationship === "household" || relationship === "introduced";
}

/**
 * The redaction layer: the only way a page leaves the API. Strangers see the page's shown
 * fields and veiled photos; the sealed section opens only inside an introduction (or to the
 * household itself). Matching-only fields are never shown outside the household.
 */
export async function toPageView(
	page: PageWithPhotos,
	relationship: PageRelationship,
	options: PageViewOptions = {},
): Promise<PageView> {
	const now = options.now ?? new Date();
	const showHeaderField = (field: VisibleField) =>
		isShownInSections(visibilityOf(page, field), relationship);

	const sections: PageView["sections"] = [];

	for (const [id, fields] of Object.entries(SECTION_FIELDS) as Array<
		[keyof typeof SECTION_FIELDS, VisibleField[]]
	>) {
		const entries: PageView["sections"][number]["fields"] = [];

		if (id === "personal" && page.dateOfBirth) {
			// Month and year are always on the page; the exact date is a sealed field by default.
			entries.push({ key: "born", value: birthMonthYear(page.dateOfBirth) });
		}

		for (const field of fields) {
			const value = readField(page, field);
			if (value === null) {
				continue;
			}
			if (!isShownInSections(visibilityOf(page, field), relationship)) {
				continue;
			}
			entries.push({ key: field, value });
		}

		const text =
			id === "family" && page.aboutFamily && showHeaderField("aboutFamily")
				? page.aboutFamily
				: undefined;

		sections.push({ id, fields: entries, ...(text ? { text } : {}) });
	}

	sections.push({ id: "about", fields: [], ...(page.aboutMe ? { text: page.aboutMe } : {}) });
	sections.push({
		id: "looking_for",
		fields: [],
		...(page.lookingFor ? { text: page.lookingFor } : {}),
	});

	let sealed: PageView["sealed"] = { open: false };
	if (isSealedOpen(relationship)) {
		const fields: Array<{ key: string; value: string }> = [];
		for (const field of SEALED_ORDER) {
			if (visibilityOf(page, field) !== "sealed") {
				continue;
			}
			if (
				field === "contactPhone" &&
				relationship === "introduced" &&
				options.phoneShared !== true
			) {
				continue;
			}
			const value = readField(page, field);
			if (value !== null) {
				fields.push({ key: field, value: Array.isArray(value) ? value.join(", ") : value });
			}
		}
		// Any other field the candidate chose to seal.
		for (const fieldList of Object.values(SECTION_FIELDS)) {
			for (const field of fieldList) {
				if (SEALED_ORDER.includes(field) || visibilityOf(page, field) !== "sealed") {
					continue;
				}
				const value = readField(page, field);
				if (value !== null) {
					fields.push({
						key: field,
						value: Array.isArray(value) ? value.join(", ") : value,
					});
				}
			}
		}
		sealed = { open: true, fields };
	}

	const heightVisible = page.height !== null && showHeaderField("height");
	const cityVisible = Boolean(page.location) && showHeaderField("location");
	const countryVisible = Boolean(page.country) && showHeaderField("country");

	return {
		handle: page.handle,
		ref: formatHandleRef(page.handle),
		relationship,
		status: page.status,
		language: page.pageLanguage,
		dir: page.pageLanguage === "ur" ? "rtl" : "ltr",
		invocation:
			page.invocation === "none"
				? null
				: {
						kind: page.invocation,
						...(page.invocation === "custom" && page.invocationText
							? { text: page.invocationText }
							: {}),
					},
		header: {
			displayName: page.displayName,
			age: page.dateOfBirth ? ageFromDateOfBirth(page.dateOfBirth, now) : null,
			birthMonthYear: page.dateOfBirth ? birthMonthYear(page.dateOfBirth) : null,
			...(heightVisible && page.height !== null ? { heightCm: page.height } : {}),
			...(cityVisible && page.location ? { city: page.location } : {}),
			...(countryVisible && page.country ? { country: page.country } : {}),
			signer: {
				createdBy: page.createdBy,
				confirmedByCandidate: page.claimedAt !== null,
				candidateFirstName: firstNameOf(page.displayName),
			},
			verification: page.verification,
		},
		sections,
		photos: await toPagePhotos(page.photos, relationship),
		sealed,
		updatedAt: page.updatedAt.toISOString(),
	};
}
