import type { BiodataProfileRow, PartnerPreferenceRow } from "@repo/database";
import { z } from "zod";

import type { ServerCopy } from "../../../lib/copy";
import { firstNameOf } from "../../biodata/lib/page-view";
import { stripComplexionSentences } from "./complexion";
import { DRAFT_BIODATA_SYSTEM_PROMPT } from "./prompts";
import { runStructured } from "./run";

export const DRAFT_SECTIONS = ["aboutMe", "aboutFamily", "lookingFor"] as const;
export type DraftSection = (typeof DRAFT_SECTIONS)[number];
export type DraftTone = "warm" | "simple" | "formal";

export interface DraftAnswers {
	family: string;
	everyday: string;
	hopes: string;
}

export interface DraftResult {
	aboutMe?: string;
	aboutFamily?: string;
	lookingFor?: string;
	omittedPhrases: string[];
	source: "ai" | "template";
}

const DraftSchema = z.object({
	aboutMe: z.string().max(1500).optional(),
	aboutFamily: z.string().max(1200).optional(),
	lookingFor: z.string().max(1200).optional(),
});

/** Structured facts only: never the sealed fields (full name, employer, income, contact, birth). */
function publicFacts(page: BiodataProfileRow, preference: PartnerPreferenceRow | null) {
	return {
		firstName: firstNameOf(page.displayName),
		author: page.createdBy,
		profession: page.profession,
		education: page.education,
		university: page.university,
		city: page.location,
		religion: page.religion,
		motherTongue: page.motherTongue,
		languages: page.languages,
		fatherOccupation: page.fatherOccupation,
		motherOccupation: page.motherOccupation,
		siblings: page.siblings,
		familyType: page.familyType,
		familyValues: page.familyValues,
		nativePlace: page.nativePlace,
		diet: page.diet,
		marriageTimeline: preference?.marriageTimeline ?? null,
	};
}

/** "an actuary", "a pharmacist": the draft templates expect the article with the profession. */
function withArticle(profession: string) {
	const lower = profession.charAt(0).toLowerCase() + profession.slice(1);
	return /^[aeiou]/i.test(lower) ? `an ${lower}` : `a ${lower}`;
}

function joinSentences(parts: Array<string | null | undefined>) {
	return parts
		.map((part) => part?.trim())
		.filter((part): part is string => Boolean(part))
		.join(" ");
}

/** The no-AI draft: the person's own answers, joined with plain facts from the page. */
export function templateDraft(params: {
	t: ServerCopy;
	page: BiodataProfileRow;
	preference: PartnerPreferenceRow | null;
	answers: DraftAnswers;
	sections: DraftSection[];
}): DraftResult {
	const { t, page, preference, answers } = params;
	const voice = page.createdBy === "self" ? "self" : "other";
	const name = firstNameOf(page.displayName);
	const city = page.location?.split(",")[0]?.trim();
	const result: DraftResult = { omittedPhrases: [], source: "template" };

	if (params.sections.includes("aboutMe")) {
		const profession = page.profession ? withArticle(page.profession) : null;
		const work = profession
			? city
				? t(`drafts.${voice}.workIn`, { name, profession, city })
				: t(`drafts.${voice}.work`, { name, profession })
			: null;
		result.aboutMe = joinSentences([work, answers.everyday]);
	}
	if (params.sections.includes("aboutFamily")) {
		result.aboutFamily = joinSentences([
			page.nativePlace
				? t(`drafts.${voice}.nativePlace`, { nativePlace: page.nativePlace })
				: null,
			page.fatherOccupation && page.motherOccupation
				? t(`drafts.${voice}.parents`, {
						name,
						father: page.fatherOccupation,
						mother: page.motherOccupation,
					})
				: null,
			answers.family,
		]);
	}
	if (params.sections.includes("lookingFor")) {
		result.lookingFor = joinSentences([
			preference?.marriageTimeline
				? t(`drafts.${voice}.timeline`, {
						name,
						timeline: t(`timelines.${preference.marriageTimeline}`),
					})
				: null,
			answers.hopes,
		]);
	}

	return cleanDraft(result);
}

function cleanDraft(draft: DraftResult): DraftResult {
	const omitted = new Set(draft.omittedPhrases);
	const cleaned: DraftResult = { omittedPhrases: [], source: draft.source };
	for (const section of DRAFT_SECTIONS) {
		const text = draft[section];
		if (!text) {
			continue;
		}
		const stripped = stripComplexionSentences(text);
		for (const phrase of stripped.omitted) {
			omitted.add(phrase);
		}
		if (stripped.text.length > 0) {
			cleaned[section] = stripped.text;
		}
	}
	cleaned.omittedPhrases = Array.from(omitted);
	return cleaned;
}

/** "Help me write": an AI draft of the free-text sections, or null to fall back. */
export async function aiDraft(params: {
	page: BiodataProfileRow;
	preference: PartnerPreferenceRow | null;
	answers: DraftAnswers;
	tone: DraftTone;
	sections: DraftSection[];
}): Promise<DraftResult | null> {
	const result = await runStructured({
		name: "draft_biodata",
		schema: DraftSchema,
		system: DRAFT_BIODATA_SYSTEM_PROMPT,
		prompt: JSON.stringify({
			tone: params.tone,
			sections: params.sections,
			facts: publicFacts(params.page, params.preference),
			answers: params.answers,
		}),
	});

	if (!result) {
		return null;
	}

	const draft: DraftResult = { omittedPhrases: [], source: "ai" };
	for (const section of params.sections) {
		const text = result[section];
		if (text) {
			draft[section] = text;
		}
	}
	return cleanDraft(draft);
}
