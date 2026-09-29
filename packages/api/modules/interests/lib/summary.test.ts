import { describe, expect, it } from "vitest";

import { letterRow, matchRow, pageRow, photoRow, proposalRow } from "../../../lib/test-fixtures";
import {
	isPriorityActive,
	isYourMove,
	letterStateFor,
	PRIORITY_WINDOW_HOURS,
	toLetterSummary,
} from "./summary";

const NOW = new Date("2026-09-26T20:00:00Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const PRIYA = "user-priya";
const ARJUN = "user-arjun";

describe("letterStateFor", () => {
	it("says whose turn a pending letter is", () => {
		const letter = letterRow({ fromUserId: ARJUN, toUserId: PRIYA });

		expect(letterStateFor(letter, PRIYA, null)).toBe("waiting_for_you");
		expect(letterStateFor(letter, ARJUN, null)).toBe("waiting_for_them");
	});

	it("follows the introduction's stage once a letter is accepted", () => {
		const letter = letterRow({ status: "accepted" });

		expect(letterStateFor(letter, PRIYA, null)).toBe("introduced");
		expect(letterStateFor(letter, PRIYA, matchRow({ stage: "call_booked" }))).toBe(
			"call_booked",
		);
		expect(letterStateFor(letter, PRIYA, matchRow({ stage: "families" }))).toBe("families");
		expect(letterStateFor(letter, PRIYA, matchRow({ stage: "closed" }))).toBe(
			"introduction_closed",
		);
	});

	it("tells each side who declined or withdrew", () => {
		const declined = letterRow({ status: "declined", fromUserId: ARJUN, toUserId: PRIYA });
		expect(letterStateFor(declined, PRIYA, null)).toBe("declined_by_you");
		expect(letterStateFor(declined, ARJUN, null)).toBe("declined_by_them");

		const withdrawn = letterRow({ status: "withdrawn", fromUserId: ARJUN, toUserId: PRIYA });
		expect(letterStateFor(withdrawn, PRIYA, null)).toBe("withdrawn_by_them");
		expect(letterStateFor(withdrawn, ARJUN, null)).toBe("withdrawn_by_you");
	});

	it("marks a letter left unanswered for 30 days as expired", () => {
		const createdAt = new Date(NOW.getTime() - 34 * DAY);
		const expired = letterRow({
			status: "closed",
			createdAt,
			closedAt: new Date(createdAt.getTime() + 30 * DAY),
		});
		expect(letterStateFor(expired, PRIYA, null)).toBe("expired");

		const closedEarly = letterRow({
			status: "closed",
			createdAt,
			closedAt: new Date(createdAt.getTime() + 3 * DAY),
		});
		expect(letterStateFor(closedEarly, PRIYA, null)).toBe("closed");

		const answeredThenClosed = letterRow({
			status: "closed",
			createdAt,
			respondedAt: new Date(createdAt.getTime() + DAY),
			closedAt: new Date(createdAt.getTime() + 31 * DAY),
		});
		expect(letterStateFor(answeredThenClosed, PRIYA, null)).toBe("closed");
	});
});

describe("isPriorityActive", () => {
	const priority = letterRow({
		isPriority: true,
		priorityUntil: new Date(NOW.getTime() + (PRIORITY_WINDOW_HOURS - 1) * HOUR),
	});

	it("is on while the window is open and the letter waits", () => {
		expect(isPriorityActive(priority, NOW)).toBe(true);
	});

	it("ends when the window passes or the letter is answered", () => {
		expect(
			isPriorityActive(priority, new Date(NOW.getTime() + PRIORITY_WINDOW_HOURS * HOUR)),
		).toBe(false);
		expect(isPriorityActive({ ...priority, status: "accepted" }, NOW)).toBe(false);
		expect(isPriorityActive({ ...priority, priorityUntil: null }, NOW)).toBe(false);
		expect(isPriorityActive(letterRow(), NOW)).toBe(false);
	});
});

describe("isYourMove", () => {
	const seen = matchRow({ sealsSeenByAAt: NOW, sealsSeenByBAt: NOW });

	it("waits on you until you have seen the seals break", () => {
		expect(
			isYourMove({ match: matchRow(), viewerUserId: PRIYA, openProposal: null, unread: 0 }),
		).toBe(true);
		expect(
			isYourMove({ match: seen, viewerUserId: PRIYA, openProposal: null, unread: 0 }),
		).toBe(false);
	});

	it("waits on you for unread words and for times someone else proposed", () => {
		expect(
			isYourMove({ match: seen, viewerUserId: PRIYA, openProposal: null, unread: 2 }),
		).toBe(true);

		const fromArjun = proposalRow({ proposedByUserId: ARJUN, availabilityA: [1] });
		expect(
			isYourMove({ match: seen, viewerUserId: PRIYA, openProposal: fromArjun, unread: 0 }),
		).toBe(true);
		expect(
			isYourMove({
				match: seen,
				viewerUserId: PRIYA,
				openProposal: { ...fromArjun, availabilityB: [2] },
				unread: 0,
			}),
		).toBe(false);
		expect(
			isYourMove({ match: seen, viewerUserId: ARJUN, openProposal: fromArjun, unread: 0 }),
		).toBe(false);
	});

	it("never waits on anyone once the introduction is closed", () => {
		expect(
			isYourMove({
				match: matchRow({ stage: "closed" }),
				viewerUserId: PRIYA,
				openProposal: null,
				unread: 5,
			}),
		).toBe(false);
	});
});

describe("toLetterSummary", () => {
	const arjunPage = {
		...pageRow({
			id: "page-arjun",
			organizationId: "org-arjun",
			userId: ARJUN,
			handle: "arm2210",
			displayName: "Arjun",
			fullName: "Arjun Mehta",
			gender: "male",
			dateOfBirth: "1994-06-02",
			location: "Toronto, Ontario",
		}),
		photos: [photoRow("after_yes")],
	};
	const flagged = letterRow({
		safetyFlag: {
			category: "money",
			categories: ["money", "off_platform"],
			reason: "Asks for money",
			source: "rules",
		},
	});

	function summarize(overrides: Partial<Parameters<typeof toLetterSummary>[0]> = {}) {
		return toLetterSummary({
			letter: flagged,
			viewerUserId: PRIYA,
			otherPage: arjunPage,
			match: null,
			openProposal: null,
			bookedSlot: null,
			unread: 0,
			hasFamilyReaction: false,
			stageLineOnly: false,
			now: NOW,
			...overrides,
		});
	}

	it("uses the first name until the seals break, then the full name", () => {
		expect(summarize().otherName).toBe("Arjun");
		expect(summarize({ match: matchRow() }).otherName).toBe("Arjun Mehta");
	});

	it("shows a safety flag to the recipient only", () => {
		expect(summarize().safetyFlag?.categories).toEqual(["money", "off_platform"]);
		expect(summarize({ viewerUserId: ARJUN }).safetyFlag).toBeUndefined();
	});

	it("gives family the stage line only: no note, no flag, no message counts", () => {
		const forFamily = summarize({
			stageLineOnly: true,
			match: matchRow({ lastMessageAt: NOW }),
			unread: 3,
		});

		expect(forFamily.firstLine).toBeNull();
		expect(forFamily.safetyFlag).toBeUndefined();
		expect(forFamily.introduction?.unread).toBe(0);
		expect(forFamily.introduction?.lastMessageAt).toBeNull();
		expect(summarize().firstLine).toBe("Your page says your family is from Jalandhar.");
	});

	it("reports age and city without the exact date of birth", () => {
		const summary = summarize();

		expect(summary.otherAge).toBe(32);
		expect(summary.otherCity).toBe("Toronto, Ontario");
		expect(JSON.stringify(summary)).not.toContain("1994-06-02");
	});
});
