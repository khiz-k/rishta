import {
	DEFAULT_FIELD_VISIBILITY,
	type FieldVisibility,
	VISIBLE_FIELDS,
	type VisibleField,
} from "@repo/database/drizzle/domain";
import type { MyPage, PageView } from "@shared/lib/api-types";

export type PreviewAs = "self" | "stranger" | "introduced" | "family_link";

function visibilityOf(page: MyPage["page"], field: string): FieldVisibility | null {
	if (!(VISIBLE_FIELDS as readonly string[]).includes(field)) {
		return null;
	}
	const key = field as VisibleField;
	return page.fieldVisibility[key] ?? DEFAULT_FIELD_VISIBILITY[key];
}

/**
 * "See it as" (design.md §5.7): re-renders your own page as a stranger (veiled, sealed), as
 * someone introduced (unsealed) or as a family link (veiled, 130%). Built from the owner view the
 * server already sent; the server's redaction layer remains the rule for everyone else.
 */
export function previewView(myPage: MyPage, as: PreviewAs): PageView {
	const view = myPage.view;
	if (as === "self") {
		return view;
	}

	const matchingOnly = (field: string) => visibilityOf(myPage.page, field) === "matching_only";

	const sections = view.sections.map((section) => {
		const fields = section.fields.filter((field) => !matchingOnly(field.key));
		// The family section's free text is the aboutFamily field, with its own visibility.
		const hideText = section.id === "family" && matchingOnly("aboutFamily");
		const { text, ...rest } = section;
		return hideText ? { ...rest, fields } : { ...rest, fields, ...(text ? { text } : {}) };
	});

	// The header carries height, city and country too; matching-only hides them there as well.
	const { heightCm, city, country, ...headerRest } = view.header;
	const header: PageView["header"] = {
		...headerRest,
		...(heightCm !== undefined && !matchingOnly("height") ? { heightCm } : {}),
		...(city !== undefined && !matchingOnly("location") ? { city } : {}),
		...(country !== undefined && !matchingOnly("country") ? { country } : {}),
	};

	const sorted = [...myPage.photos].sort((a, b) => a.position - b.position);
	const photos = sorted.map((photo) => {
		const clear =
			as === "introduced"
				? true
				: as === "family_link"
					? false
					: photo.visibility === "everyone";
		return {
			id: photo.id,
			url: clear ? photo.url : photo.veilUrl,
			veiled: !clear,
			width: photo.width,
			height: photo.height,
		};
	});

	return {
		...view,
		relationship: as,
		header,
		sections,
		photos,
		sealed: as === "introduced" ? view.sealed : { open: false },
	};
}
