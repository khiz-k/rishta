import { getZonedParts, toLocalDateString, zonedTimeToUtc } from "../../../lib/time";

const MINUTE_MS = 60 * 1000;
const STEP_MINUTES = 30;
const STEP_MS = STEP_MINUTES * MINUTE_MS;

/** Evenings: both local start times between 18:00 and 22:00 (the last start is 21:30). */
const EVENING = { start: 18 * 60, end: 22 * 60 };
/**
 * Fallback windows when two time zones share no evening (London and Los Angeles): a wider
 * evening, then the whole waking day. Deterministic, and each person still ticks what works.
 */
const FALLBACK_WINDOWS = [
	{ start: 17 * 60, end: 23 * 60 },
	{ start: 8 * 60, end: 23 * 60 },
];

export const PROPOSAL_SLOT_COUNT = 3;
export const PROPOSAL_HORIZON_DAYS = 21;
/** The first proposed evening is at least this far away, so nobody is rushed. */
const LEAD_HOURS = 18;

function localMinutes(date: Date, timeZone: string) {
	const parts = getZonedParts(date, timeZone);
	return parts.hour * 60 + parts.minute;
}

function fitsWindow(minutes: number, window: { start: number; end: number }) {
	return minutes >= window.start && minutes <= window.end - STEP_MINUTES;
}

function collectEvenings(params: {
	from: number;
	until: number;
	timeZoneA: string;
	timeZoneB: string;
	window: { start: number; end: number };
}) {
	const byDate = new Map<string, Date[]>();
	for (let t = params.from; t < params.until; t += STEP_MS) {
		const instant = new Date(t);
		if (
			fitsWindow(localMinutes(instant, params.timeZoneA), params.window) &&
			fitsWindow(localMinutes(instant, params.timeZoneB), params.window)
		) {
			const date = toLocalDateString(instant, params.timeZoneA);
			const list = byDate.get(date) ?? [];
			list.push(instant);
			byDate.set(date, list);
		}
	}
	return byDate;
}

/**
 * The introduction's three proposed evenings (spec.md F9): the next three dates where both local
 * times fall in the evening, on 30-minute steps, each at the middle of the shared window.
 */
export function proposeEvenings(params: {
	now: Date;
	timeZoneA: string;
	timeZoneB: string;
	count?: number;
}): Date[] {
	const count = params.count ?? PROPOSAL_SLOT_COUNT;
	const earliest = params.now.getTime() + LEAD_HOURS * 60 * MINUTE_MS;
	const from = Math.ceil(earliest / STEP_MS) * STEP_MS;
	const until = from + PROPOSAL_HORIZON_DAYS * 24 * 60 * MINUTE_MS;

	for (const window of [EVENING, ...FALLBACK_WINDOWS]) {
		const byDate = collectEvenings({
			from,
			until,
			timeZoneA: params.timeZoneA,
			timeZoneB: params.timeZoneB,
			window,
		});
		if (byDate.size >= count) {
			return Array.from(byDate.values())
				.slice(0, count)
				.map((instants) => instants[Math.floor((instants.length - 1) / 2)] ?? instants[0])
				.filter((instant): instant is Date => instant instanceof Date);
		}
	}

	// Last resort: 8:00 pm for the sender on the next three days.
	const firstDate = toLocalDateString(new Date(from), params.timeZoneA);
	const [year, month, day] = firstDate.split("-").map(Number);
	return Array.from({ length: count }, (_, index) => {
		const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, (day ?? 1) + index));
		const dateString = date.toISOString().slice(0, 10);
		return zonedTimeToUtc(dateString, 20, 0, params.timeZoneA);
	});
}

/** Three future, distinct, 30-minute-aligned slots within 21 days, or a reason they are not. */
export function validateProposedSlots(slots: Date[], now: Date) {
	if (slots.length !== PROPOSAL_SLOT_COUNT) {
		return "count";
	}
	const times = slots.map((slot) => slot.getTime());
	if (new Set(times).size !== times.length) {
		return "distinct";
	}
	if (times.some((time) => time <= now.getTime())) {
		return "future";
	}
	if (times.some((time) => time > now.getTime() + PROPOSAL_HORIZON_DAYS * 24 * 60 * MINUTE_MS)) {
		return "horizon";
	}
	if (times.some((time) => time % STEP_MS !== 0)) {
		return "aligned";
	}
	return null;
}

/** The lowest slot index both people ticked, or null. A proposer's own side is all three. */
export function firstSharedSlot(availabilityA: number[], availabilityB: number[]) {
	const shared = availabilityA.filter((index) => availabilityB.includes(index));
	return shared.length > 0 ? Math.min(...shared) : null;
}
