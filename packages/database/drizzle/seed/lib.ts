import { randomBytes, scrypt } from "node:crypto";

/** Time helpers for the seed: every date is relative to the run, and "today" is household-local. */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const SEED_NOW = new Date();

export function ago(parts: { days?: number; hours?: number; minutes?: number }) {
	const offset =
		(parts.days ?? 0) * DAY + (parts.hours ?? 0) * HOUR + (parts.minutes ?? 0) * MINUTE;
	return new Date(SEED_NOW.getTime() - offset);
}

export function fromNow(parts: { days?: number; hours?: number; minutes?: number }) {
	const offset =
		(parts.days ?? 0) * DAY + (parts.hours ?? 0) * HOUR + (parts.minutes ?? 0) * MINUTE;
	return new Date(SEED_NOW.getTime() + offset);
}

function pad(value: number) {
	return value < 10 ? `0${value}` : String(value);
}

interface LocalParts {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	weekday: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function localParts(date: Date, timeZone: string): LocalParts {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		hourCycle: "h23",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		weekday: "short",
	}).formatToParts(date);
	const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "0";
	return {
		year: Number(read("year")),
		month: Number(read("month")),
		day: Number(read("day")),
		hour: Number(read("hour")) % 24,
		minute: Number(read("minute")),
		weekday: WEEKDAYS.indexOf(read("weekday")),
	};
}

export function localDate(date: Date, timeZone: string) {
	const parts = localParts(date, timeZone);
	return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function addDays(dateString: string, days: number) {
	const [year, month, day] = dateString.split("-").map(Number);
	const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, (day ?? 1) + days));
	return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** A wall-clock time on a local date as a UTC instant (DST-safe). */
export function zoned(dateString: string, hour: number, minute: number, timeZone: string) {
	const [year, month, day] = dateString.split("-").map(Number);
	const guess = Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, hour, minute);
	const offsetAt = (instant: number) => {
		const parts = localParts(new Date(instant), timeZone);
		return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - instant;
	};
	const first = offsetAt(guess);
	let result = guess - first;
	const second = offsetAt(result);
	if (second !== first) {
		result = guess - second;
	}
	return new Date(result);
}

/** A moment earlier today in the household's own day (never before its local midnight). */
export function earlierToday(minutesAgo: number, timeZone: string) {
	const midnight = zoned(localDate(SEED_NOW, timeZone), 0, 0, timeZone);
	const sinceMidnight = SEED_NOW.getTime() - midnight.getTime();
	const offset = Math.min(minutesAgo * MINUTE, Math.max(sinceMidnight - MINUTE, 0));
	return new Date(SEED_NOW.getTime() - offset);
}

/** Mirrors the API's release window: before 19:00 local, yesterday's folio is current. */
export function currentReleaseDate(timeZone: string, releaseHour = 19) {
	const today = localDate(SEED_NOW, timeZone);
	return SEED_NOW.getTime() >= zoned(today, releaseHour, 0, timeZone).getTime()
		? today
		: addDays(today, -1);
}

/** The next given weekday (0 = Sunday) after today, at a local wall-clock time. */
export function nextWeekdayAt(weekday: number, hour: number, minute: number, timeZone: string) {
	const today = localDate(SEED_NOW, timeZone);
	const todayWeekday = localParts(SEED_NOW, timeZone).weekday;
	let delta = (weekday - todayWeekday + 7) % 7;
	if (delta === 0) {
		delta = 7;
	}
	return zoned(addDays(today, delta), hour, minute, timeZone);
}

/** A YYYY-MM-DD date of birth for someone of `age` years today. */
export function dateOfBirthForAge(age: number, month: number, day: number) {
	const year = SEED_NOW.getUTCFullYear() - age;
	const birthdayPassed =
		SEED_NOW.getUTCMonth() + 1 > month ||
		(SEED_NOW.getUTCMonth() + 1 === month && SEED_NOW.getUTCDate() >= day);
	return `${birthdayPassed ? year : year - 1}-${pad(month)}-${pad(day)}`;
}

/**
 * Better Auth's password format (better-auth/crypto): scrypt N=16384, r=16, p=1, 64-byte key,
 * NFKC-normalised password, a 16-byte hex salt used as a string, stored as `salt:key`.
 */
export async function hashPassword(password: string) {
	const salt = randomBytes(16).toString("hex");
	const key = await new Promise<Buffer>((resolve, reject) => {
		scrypt(
			password.normalize("NFKC"),
			salt,
			64,
			{ N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
			(error, derived) => (error ? reject(error) : resolve(derived)),
		);
	});
	return `${salt}:${key.toString("hex")}`;
}

export function generatePassword() {
	return `rishta-${randomBytes(6).toString("base64url")}`;
}

/** DiceBear portraits, served through the same veil and clear rules as uploads. */
export function portraitKeys(seed: string, index: number) {
	const base = `https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(`${seed}-${index}`)}&backgroundColor=f4ecdc`;
	return {
		storageKey: `external:${base}&size=512`,
		veilKey: `external:${base}&size=32`,
		width: 512,
		height: 512,
	};
}
