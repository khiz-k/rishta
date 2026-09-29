/**
 * Hard rules for a sealed note (spec.md F6). Contact details are refused in a note because
 * contact opens only when both say yes; a stored first-line suggestion must be made one's own.
 */

export const NOTE_MIN_LENGTH = 40;
export const NOTE_MAX_LENGTH = 400;

export type ContactKind = "phone" | "email" | "url" | "handle";

const PHONE_RUN = /\+?\(?\d[\d\s\-().]{7,}\d/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;
const OBFUSCATED_EMAIL =
	/[\w.+-]+\s*(?:\(at\)|\[at\]|\sat\s)\s*[\w-]+\s*(?:\(dot\)|\[dot\]|\sdot\s)\s*(?:com|net|org|in|co|uk|ca|io|me)\b/i;
const URL =
	/\bhttps?:\/\/\S+|\bwww\.\S+|\b(?:wa\.me|t\.me|m\.me|signal\.me)\/\S*|\b[\w-]+\.(?:com|net|org|io|me|in|co|uk|ca|app|ly|link)(?:\/\S*)?\b/i;
const MESSENGER_HANDLE =
	/\b(?:whats\s?app|telegram|signal|insta(?:gram)?|snap(?:chat)?|wechat|viber|kik)\b[^\n]{0,16}?[:@]\s*@?[\w.]{3,}/i;
const AT_HANDLE = /(?:^|\s)@[a-z0-9_.]{3,}/i;

function hasPhoneNumber(text: string) {
	const runs = text.match(PHONE_RUN) ?? [];
	return runs.some((run) => run.replace(/\D/g, "").length >= 9);
}

/** The first kind of contact detail found in a text, or null. */
export function findContactDetails(text: string): ContactKind | null {
	if (hasPhoneNumber(text)) {
		return "phone";
	}
	if (EMAIL.test(text) || OBFUSCATED_EMAIL.test(text)) {
		return "email";
	}
	if (URL.test(text)) {
		return "url";
	}
	if (MESSENGER_HANDLE.test(text) || AT_HANDLE.test(text)) {
		return "handle";
	}
	return null;
}

function normaliseForComparison(text: string) {
	return text
		.toLowerCase()
		.replace(/[‘’]/g, "'")
		.replace(/[“”]/g, '"')
		.replace(/[.,!?;:"']+$/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

/** True when the note still contains a suggested line word for word. */
export function containsSuggestionVerbatim(note: string, suggestionLines: string[]) {
	const normalisedNote = normaliseForComparison(note);
	return suggestionLines.some((line) => {
		const normalisedLine = normaliseForComparison(line);
		return normalisedLine.length > 0 && normalisedNote.includes(normalisedLine);
	});
}

/** The first line of a note, for letter rows (never more than 140 characters). */
export function firstLineOf(note: string | null) {
	if (!note) {
		return null;
	}
	const firstLine = note.trim().split(/\n/)[0] ?? "";
	const sentence = firstLine.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() ?? firstLine;
	return sentence.length > 140 ? `${sentence.slice(0, 139).trimEnd()}…` : sentence;
}
