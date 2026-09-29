import {
	addDaysToDateString,
	getZonedParts,
	toLocalDateString,
	zonedTimeToUtc,
} from "@repo/api/lib/time";

/** 30-minute steps, both people's evenings (18:00–22:00) marked, within 21 days (spec.md F9). */
export const STEP_MINUTES = 30;
export const HORIZON_DAYS = 21;
const EVENING_START = 18 * 60;
const EVENING_LAST_START = 21 * 60 + 30;

export function localMinutes(date: Date, timeZone: string) {
	const parts = getZonedParts(date, timeZone);
	return parts.hour * 60 + parts.minute;
}

export function isEvening(date: Date, timeZone: string) {
	const minutes = localMinutes(date, timeZone);
	return minutes >= EVENING_START && minutes <= EVENING_LAST_START;
}

/** The next `count` local dates in a zone, starting tomorrow. */
export function upcomingDates(timeZone: string, count: number, now = new Date()) {
	const today = toLocalDateString(now, timeZone);
	return Array.from({ length: count }, (_, index) => addDaysToDateString(today, index + 1));
}

/** Half-hour start times on a local date, from 5:00 pm to 10:30 pm in the proposer's zone. */
export function timesOnDate(dateString: string, timeZone: string) {
	const times: Date[] = [];
	for (let minutes = 17 * 60; minutes <= 22 * 60 + 30; minutes += STEP_MINUTES) {
		times.push(zonedTimeToUtc(dateString, Math.floor(minutes / 60), minutes % 60, timeZone));
	}
	return times;
}

/** Midday on a local date, for labelling the day cell in that zone. */
export function middayOf(dateString: string, timeZone: string) {
	return zonedTimeToUtc(dateString, 12, 0, timeZone);
}

export function isWithinHorizon(date: Date, now = new Date()) {
	return (
		date.getTime() > now.getTime() &&
		date.getTime() <= now.getTime() + HORIZON_DAYS * 24 * 60 * 60 * 1000
	);
}
