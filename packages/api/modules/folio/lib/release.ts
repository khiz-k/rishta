import { addDaysToDateString, toLocalDateString, zonedTimeToUtc } from "../../../lib/time";

export interface ReleaseWindow {
	/** The household-local date of the folio that is current now. */
	releaseDate: string;
	/** When that folio was (or is) released. */
	releasedAt: Date;
	/** When the next folio arrives. */
	nextReleaseAt: Date;
}

/**
 * The folio released at `releaseHour` (default 19:00) in the household's time zone. Before
 * today's release, yesterday's folio stays current (spec.md F5).
 */
export function getReleaseWindow(now: Date, timeZone: string, releaseHour: number): ReleaseWindow {
	const today = toLocalDateString(now, timeZone);
	const todaysRelease = zonedTimeToUtc(today, releaseHour, 0, timeZone);

	if (now.getTime() >= todaysRelease.getTime()) {
		const tomorrow = addDaysToDateString(today, 1);
		return {
			releaseDate: today,
			releasedAt: todaysRelease,
			nextReleaseAt: zonedTimeToUtc(tomorrow, releaseHour, 0, timeZone),
		};
	}

	const yesterday = addDaysToDateString(today, -1);
	return {
		releaseDate: yesterday,
		releasedAt: zonedTimeToUtc(yesterday, releaseHour, 0, timeZone),
		nextReleaseAt: todaysRelease,
	};
}
