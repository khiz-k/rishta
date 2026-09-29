import { TEXT_MODEL_ID } from "@repo/ai";
import {
	getCachedTranslation,
	saveTranslation,
	type BiodataProfileRow,
	type PageLanguage,
	type TranslatedPage,
} from "@repo/database";
import { z } from "zod";

import type { PageView } from "../../biodata/types";
import { TRANSLATE_PAGE_SYSTEM_PROMPT } from "./prompts";
import { runStructured } from "./run";

/** Free-text values worth translating; enum values and labels come from the `family` bundle. */
const TRANSLATABLE_KEYS = new Set([
	"profession",
	"university",
	"fatherOccupation",
	"motherOccupation",
	"siblings",
	"nativePlace",
	"community",
	"sect",
	"motherTongue",
]);

const LANGUAGE_NAMES: Record<PageLanguage, string> = {
	en: "English",
	hi: "Hindi (Devanagari)",
	ur: "Urdu (Nastaliq)",
	pa: "Punjabi (Gurmukhi)",
	gu: "Gujarati",
	bn: "Bengali",
	ta: "Tamil",
	te: "Telugu",
};

const TranslationSchema = z.object({
	fields: z.array(z.object({ key: z.string(), value: z.string() })),
	about: z.string().optional(),
	aboutFamily: z.string().optional(),
	lookingFor: z.string().optional(),
	note: z.string().optional(),
});

function sectionText(view: PageView, id: PageView["sections"][number]["id"]) {
	return view.sections.find((section) => section.id === id)?.text;
}

function collectSource(view: PageView) {
	const fields: Array<{ key: string; value: string }> = [];
	for (const section of view.sections) {
		for (const field of section.fields) {
			if (TRANSLATABLE_KEYS.has(field.key) && typeof field.value === "string") {
				fields.push({ key: field.key, value: field.value });
			}
		}
	}
	return {
		fields,
		about: sectionText(view, "about"),
		aboutFamily: sectionText(view, "family"),
		lookingFor: sectionText(view, "looking_for"),
	};
}

export function applyTranslation(view: PageView, translation: TranslatedPage): PageView {
	const byKey = new Map(translation.fields.map((field) => [field.key, field.value]));
	return {
		...view,
		sections: view.sections.map((section) => {
			const text =
				section.id === "about"
					? (translation.about ?? section.text)
					: section.id === "family"
						? (translation.aboutFamily ?? section.text)
						: section.id === "looking_for"
							? (translation.lookingFor ?? section.text)
							: section.text;
			return {
				...section,
				fields: section.fields.map((field) =>
					typeof field.value === "string" && byKey.has(field.key)
						? { key: field.key, value: byKey.get(field.key) ?? field.value }
						: field,
				),
				...(text ? { text } : {}),
			};
		}),
	};
}

/**
 * Translates a stranger-redacted page for a family link (spec.md §9c), cached per
 * (page, language, page version). Returns null when no translation is available: the link then
 * shows the original values with translated labels.
 */
export async function translatePageView(params: {
	page: Pick<BiodataProfileRow, "id" | "updatedAt" | "pageLanguage">;
	view: PageView;
	language: PageLanguage;
}): Promise<PageView | null> {
	if (params.language === params.page.pageLanguage) {
		return null;
	}

	const cached = await getCachedTranslation({
		profileId: params.page.id,
		language: params.language,
		sourceUpdatedAt: params.page.updatedAt,
	});
	if (cached) {
		return applyTranslation(params.view, cached.content);
	}

	const source = collectSource(params.view);
	const translated = await runStructured({
		name: "translate_page",
		schema: TranslationSchema,
		system: TRANSLATE_PAGE_SYSTEM_PROMPT,
		prompt: `Target language: ${LANGUAGE_NAMES[params.language]}.\nTranslate this JSON and return the same shape:\n${JSON.stringify(source)}`,
	});

	if (!translated) {
		return null;
	}

	const content: TranslatedPage = {
		fields: translated.fields.filter((field) => TRANSLATABLE_KEYS.has(field.key)),
		...(translated.about ? { about: translated.about } : {}),
		...(translated.aboutFamily ? { aboutFamily: translated.aboutFamily } : {}),
		...(translated.lookingFor ? { lookingFor: translated.lookingFor } : {}),
	};

	await saveTranslation({
		profileId: params.page.id,
		language: params.language,
		sourceUpdatedAt: params.page.updatedAt,
		content,
		model: TEXT_MODEL_ID,
	});

	return applyTranslation(params.view, content);
}

/** A note is translated per request and kept in memory only (never stored). */
const noteCache = new Map<string, string>();

export async function translateNote(params: {
	letterId: string;
	note: string;
	language: PageLanguage;
}) {
	const cacheKey = `${params.letterId}:${params.language}`;
	const cached = noteCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const translated = await runStructured({
		name: "translate_note",
		schema: TranslationSchema,
		system: TRANSLATE_PAGE_SYSTEM_PROMPT,
		prompt: `Target language: ${LANGUAGE_NAMES[params.language]}.\nTranslate this JSON and return the same shape:\n${JSON.stringify({ fields: [], note: params.note })}`,
	});

	if (!translated?.note) {
		return null;
	}
	if (noteCache.size > 500) {
		noteCache.clear();
	}
	noteCache.set(cacheKey, translated.note);
	return translated.note;
}
