import type { BiodataProfileRow, PartnerPreferenceRow } from "@repo/database";

import type { SectionId } from "../../biodata/types";

/** "Family: 2 of 5": completeness in words per section, in the margin (spec.md F4). */
export function getCompleteness(
	page: BiodataProfileRow,
	preference: PartnerPreferenceRow | null,
): Record<SectionId, { filled: number; total: number }> {
	const count = (values: Array<string | number | boolean | string[] | null | undefined>) =>
		values.filter((value) => {
			if (Array.isArray(value)) {
				return value.length > 0;
			}
			if (typeof value === "string") {
				return value.trim() !== "";
			}
			return value !== null && value !== undefined;
		}).length;

	const personal = [
		page.dateOfBirth,
		page.height,
		page.maritalStatus,
		page.religion,
		page.motherTongue,
		page.languages,
		page.community,
	];
	const education = [page.education, page.university, page.profession, page.employer];
	const family = [
		page.fatherOccupation,
		page.motherOccupation,
		page.siblings,
		page.familyType,
		page.nativePlace,
	];
	const lifestyle = [page.diet, page.smoking, page.drinking];

	return {
		personal: { filled: count(personal), total: personal.length },
		education: { filled: count(education), total: education.length },
		family: { filled: count(family), total: family.length },
		lifestyle: { filled: count(lifestyle), total: lifestyle.length },
		about: { filled: count([page.aboutMe]), total: 1 },
		looking_for: {
			filled: count([page.lookingFor]) + (preference?.completedAt ? 1 : 0),
			total: 2,
		},
	};
}

/** The required four before a page can be published. */
export function missingRequiredFields(page: BiodataProfileRow) {
	const missing: string[] = [];
	if (!page.displayName.trim()) {
		missing.push("displayName");
	}
	if (!page.gender) {
		missing.push("gender");
	}
	if (!page.dateOfBirth) {
		missing.push("dateOfBirth");
	}
	if (!page.religion) {
		missing.push("religion");
	}
	return missing;
}
