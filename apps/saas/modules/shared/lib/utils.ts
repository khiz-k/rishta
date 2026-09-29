import { ageFromDateOfBirth } from "@repo/api/lib/time";

/**
 * Age from a date of birth (YYYY-MM-DD). Pages carry their age from the API; this stays for the
 * few client-side previews that need it, and shares the server's rule so the two never disagree.
 */
export function calcAge(dob: string, now = new Date()): number {
	return ageFromDateOfBirth(dob, now);
}

/**
 * One 10ms haptic at the moment the seal presses, where supported, and nowhere else in the
 * product (design.md §6.3).
 */
export function haptic() {
	if (typeof navigator !== "undefined" && "vibrate" in navigator) {
		navigator.vibrate(10);
	}
}
