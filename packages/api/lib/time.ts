/** Time-zone helpers built on Intl only (no dependency), used for household-local days. */

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ZonedParts {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
	weekday: number; // 0 = Sunday
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string) {
	let formatter = formatterCache.get(timeZone);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-US", {
			timeZone,
			hourCycle: "h23",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			weekday: "short",
		});
		formatterCache.set(timeZone, formatter);
	}
	return formatter;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function isValidTimeZone(timeZone: string) {
	try {
		getFormatter(timeZone);
		return true;
	} catch {
		return false;
	}
}

export function getZonedParts(date: Date, timeZone: string): ZonedParts {
	const parts = getFormatter(timeZone).formatToParts(date);
	const read = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((part) => part.type === type)?.value ?? "0";

	return {
		year: Number(read("year")),
		month: Number(read("month")),
		day: Number(read("day")),
		hour: Number(read("hour")) % 24,
		minute: Number(read("minute")),
		second: Number(read("second")),
		weekday: WEEKDAYS.indexOf(read("weekday")),
	};
}

/** The offset (local minus UTC) in milliseconds at an instant. */
function getOffsetMs(date: Date, timeZone: string) {
	const parts = getZonedParts(date, timeZone);
	const asUtc = Date.UTC(
		parts.year,
		parts.month - 1,
		parts.day,
		parts.hour,
		parts.minute,
		parts.second,
	);
	return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

function pad(value: number) {
	return value < 10 ? `0${value}` : String(value);
}

/** The household-local calendar date ("YYYY-MM-DD") at an instant. */
export function toLocalDateString(date: Date, timeZone: string) {
	const parts = getZonedParts(date, timeZone);
	return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function parseDateString(value: string) {
	const [year, month, day] = value.split("-").map(Number);
	return { year: year ?? 1970, month: month ?? 1, day: day ?? 1 };
}

export function addDaysToDateString(value: string, days: number) {
	const { year, month, day } = parseDateString(value);
	const date = new Date(Date.UTC(year, month - 1, day) + days * DAY_MS);
	return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** The UTC instant of a wall-clock time on a local date, correct across DST changes. */
export function zonedTimeToUtc(dateString: string, hour: number, minute: number, timeZone: string) {
	const { year, month, day } = parseDateString(dateString);
	const guess = Date.UTC(year, month - 1, day, hour, minute);
	const firstOffset = getOffsetMs(new Date(guess), timeZone);
	let result = guess - firstOffset;
	const secondOffset = getOffsetMs(new Date(result), timeZone);
	if (secondOffset !== firstOffset) {
		result = guess - secondOffset;
	}
	return new Date(result);
}

/** Midnight of the household-local day containing `date`, as a UTC instant. */
export function startOfLocalDay(date: Date, timeZone: string) {
	return zonedTimeToUtc(toLocalDateString(date, timeZone), 0, 0, timeZone);
}

/** Whole years between a YYYY-MM-DD birth date and `now` (UTC calendar). */
export function ageFromDateOfBirth(dateOfBirth: string, now = new Date()) {
	const { year, month, day } = parseDateString(dateOfBirth);
	let age = now.getUTCFullYear() - year;
	const beforeBirthday =
		now.getUTCMonth() + 1 < month ||
		(now.getUTCMonth() + 1 === month && now.getUTCDate() < day);
	if (beforeBirthday) {
		age -= 1;
	}
	return age;
}

/** "1997-03": strangers see the birth month and year only; the full date opens with the seal. */
export function birthMonthYear(dateOfBirth: string) {
	return dateOfBirth.slice(0, 7);
}

export function daysBetween(earlier: Date, later: Date) {
	return (later.getTime() - earlier.getTime()) / DAY_MS;
}

export { DAY_MS };

/** "Thu 2 Oct, 8:00 pm" in a person's own time zone, for notification lines. */
export function formatCallTime(date: Date, timeZone: string, locale = "en-GB") {
	return new Intl.DateTimeFormat(locale, {
		timeZone,
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(date);
}
