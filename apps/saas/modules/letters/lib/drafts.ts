/**
 * Drafts are kept in localStorage per household and page (design.md §6.6): Esc, a closed sheet
 * or a failed send never loses a word.
 */
const PREFIX = "rishta:draft";

function key(organizationId: string, target: string) {
	return `${PREFIX}:${organizationId}:${target}`;
}

export function readDraft(organizationId: string, target: string) {
	if (typeof window === "undefined") {
		return "";
	}
	try {
		return window.localStorage.getItem(key(organizationId, target)) ?? "";
	} catch {
		return "";
	}
}

export function writeDraft(organizationId: string, target: string, value: string) {
	if (typeof window === "undefined") {
		return;
	}
	try {
		if (value.trim().length === 0) {
			window.localStorage.removeItem(key(organizationId, target));
		} else {
			window.localStorage.setItem(key(organizationId, target), value);
		}
	} catch {
		// Storage full or disabled: the draft simply isn't kept.
	}
}

export function clearDraft(organizationId: string, target: string) {
	writeDraft(organizationId, target, "");
}

export function newIdempotencyKey() {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
