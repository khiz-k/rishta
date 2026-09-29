/**
 * Quiet, locale-aware formatting for dates, times and heights. English uses the day-month
 * order and lower-case "pm" the mockups use ("24 Sep, 9:12 pm"); other locales use their own.
 */

export function intlLocale(locale: string) {
	return locale === "en" ? "en-GB" : locale;
}

function toDate(value: string | Date) {
	return typeof value === "string" ? new Date(value) : value;
}

/** "21 Sep" */
export function formatShortDate(value: string | Date, locale: string, timeZone?: string) {
	return new Intl.DateTimeFormat(intlLocale(locale), {
		day: "numeric",
		month: "short",
		...(timeZone ? { timeZone } : {}),
	}).format(toDate(value));
}

/** "26 Sep 2026" */
export function formatLongDate(value: string | Date, locale: string, timeZone?: string) {
	return new Intl.DateTimeFormat(intlLocale(locale), {
		day: "numeric",
		month: "short",
		year: "numeric",
		...(timeZone ? { timeZone } : {}),
	}).format(toDate(value));
}

/** "Thursday 2 October" */
export function formatFullDay(value: string | Date, locale: string, timeZone?: string) {
	return new Intl.DateTimeFormat(intlLocale(locale), {
		weekday: "long",
		day: "numeric",
		month: "long",
		...(timeZone ? { timeZone } : {}),
	}).format(toDate(value));
}

/** "Thu 2 Oct" */
export function formatSlotDay(value: string | Date, locale: string, timeZone?: string) {
	return new Intl.DateTimeFormat(intlLocale(locale), {
		weekday: "short",
		day: "numeric",
		month: "short",
		...(timeZone ? { timeZone } : {}),
	}).format(toDate(value));
}

/** "8:00 pm" */
export function formatTime(value: string | Date, locale: string, timeZone?: string) {
	return new Intl.DateTimeFormat(intlLocale(locale), {
		hour: "numeric",
		minute: "2-digit",
		...(timeZone ? { timeZone } : {}),
	}).format(toDate(value));
}

/** "24 Sep, 9:12 pm" */
export function formatDateTime(value: string | Date, locale: string, timeZone?: string) {
	return `${formatShortDate(value, locale, timeZone)}, ${formatTime(value, locale, timeZone)}`;
}

/** "Friday" */
export function formatWeekday(value: string | Date, locale: string, timeZone?: string) {
	return new Intl.DateTimeFormat(intlLocale(locale), {
		weekday: "long",
		...(timeZone ? { timeZone } : {}),
	}).format(toDate(value));
}

/** "June 1994" from "1994-06" or "1994-06-12". */
export function formatMonthYear(value: string, locale: string) {
	const [year, month] = value.split("-").map(Number);
	if (!year || !month) {
		return value;
	}
	return new Intl.DateTimeFormat(intlLocale(locale), {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(Date.UTC(year, month - 1, 1)));
}

/** "12 June 1994" from "1994-06-12". */
export function formatBirthDate(value: string, locale: string) {
	const [year, month, day] = value.split("-").map(Number);
	if (!year || !month || !day) {
		return value;
	}
	return new Intl.DateTimeFormat(intlLocale(locale), {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(Date.UTC(year, month - 1, day)));
}

/** "5′10″" */
export function formatFeetInches(cm: number) {
	const totalInches = Math.round(cm / 2.54);
	const feet = Math.floor(totalInches / 12);
	const inches = totalInches % 12;
	return `${feet}′${inches}″`;
}

/** "5′10″ (178 cm)" */
export function formatHeight(cm: number) {
	return `${formatFeetInches(cm)} (${cm} cm)`;
}

export function daysSince(value: string | Date, now = new Date()) {
	return Math.max(0, Math.floor((now.getTime() - toDate(value).getTime()) / 86_400_000));
}

export function isSameLocalDay(a: string | Date, b: string | Date, timeZone?: string) {
	const format = (value: string | Date) =>
		new Intl.DateTimeFormat("en-CA", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			...(timeZone ? { timeZone } : {}),
		}).format(toDate(value));
	return format(a) === format(b);
}

/** The first word of a display name ("Priya S." → "Priya"). */
export function firstNameOf(displayName: string) {
	return displayName.trim().split(/\s+/)[0] ?? displayName;
}

/** The city alone from "Edison, New Jersey". */
export function cityOf(location: string | null | undefined) {
	if (!location) {
		return null;
	}
	return location.split(",")[0]?.trim() || null;
}

/** The last segment of an IANA zone as a readable place ("America/New_York" → "New York"). */
export function zonePlace(timeZone: string) {
	const last = timeZone.split("/").pop() ?? timeZone;
	return last.replace(/_/g, " ");
}
