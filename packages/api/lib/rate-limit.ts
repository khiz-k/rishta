/**
 * A small in-memory fixed-window limiter for public endpoints (family links) and AI drafts.
 * Per server instance only: good enough to blunt abuse in the MVP, not a quota system.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
	const current = windows.get(key);

	if (!current || current.resetAt <= now) {
		windows.set(key, { count: 1, resetAt: now + windowMs });
		pruneExpired(now);
		return true;
	}

	if (current.count >= limit) {
		return false;
	}

	current.count += 1;
	return true;
}

function pruneExpired(now: number) {
	if (windows.size < 5000) {
		return;
	}
	for (const [key, value] of windows) {
		if (value.resetAt <= now) {
			windows.delete(key);
		}
	}
}

/** The first IP in a forwarded chain, for rate-limit keys only (never stored). */
export function getClientIp(headers: Headers) {
	const forwarded = headers.get("x-forwarded-for");
	return forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
