/** A minimal RFC 5545 calendar invite for a booked first call (spec.md F9, §10). */

function formatUtc(date: Date) {
	return date
		.toISOString()
		.replace(/[-:]/g, "")
		.replace(/\.\d{3}/, "");
}

function escapeText(value: string) {
	return value
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\r\n?|\n/g, "\\n");
}

/** UTF-8 length of one code point: names in Devanagari or Nastaliq are three octets a letter. */
function octetsOf(char: string) {
	const codePoint = char.codePointAt(0) ?? 0;
	if (codePoint < 0x80) {
		return 1;
	}
	if (codePoint < 0x800) {
		return 2;
	}
	return codePoint < 0x10000 ? 3 : 4;
}

/**
 * Lines over 75 octets are folded with CRLF and a leading space (RFC 5545 §3.1). Folds fall
 * between code points, never inside a character, and a continuation line's space counts.
 */
export function foldLine(line: string) {
	const parts: string[] = [];
	let current = "";
	let octets = 0;
	for (const char of line) {
		const size = octetsOf(char);
		const limit = parts.length === 0 ? 75 : 74;
		if (octets + size > limit) {
			parts.push(current);
			current = "";
			octets = 0;
		}
		current += char;
		octets += size;
	}
	parts.push(current);
	return parts.join("\r\n ");
}

export function buildCallInvite(params: {
	uid: string;
	start: Date;
	durationMinutes?: number;
	summary: string;
	description: string;
	url?: string;
	now?: Date;
}) {
	const end = new Date(params.start.getTime() + (params.durationMinutes ?? 30) * 60 * 1000);
	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Rishta//First call//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"BEGIN:VEVENT",
		`UID:${params.uid}@rishta`,
		`DTSTAMP:${formatUtc(params.now ?? new Date())}`,
		`DTSTART:${formatUtc(params.start)}`,
		`DTEND:${formatUtc(end)}`,
		`SUMMARY:${escapeText(params.summary)}`,
		`DESCRIPTION:${escapeText(params.description)}`,
		...(params.url ? [`URL:${params.url}`] : []),
		"END:VEVENT",
		"END:VCALENDAR",
	];
	return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
