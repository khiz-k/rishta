import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", () => ({
	countUnreadByMatch: vi.fn(),
	getBlockedUserIdsEitherWay: vi.fn(),
	getMarginNotes: vi.fn(),
	getPagesByUserIds: vi.fn(),
	getProposalsForMatches: vi.fn(),
}));

import {
	countUnreadByMatch,
	getBlockedUserIdsEitherWay,
	getMarginNotes,
	getPagesByUserIds,
	getProposalsForMatches,
} from "@repo/database";

import { letterRow, marginNoteRow, pageRow } from "../../../lib/test-fixtures";
import { summarizeLetters } from "./load";

const arjunPage = {
	...pageRow({ id: "page-arjun", organizationId: "org-arjun", userId: "user-arjun" }),
	photos: [],
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(getBlockedUserIdsEitherWay).mockResolvedValue(new Set());
	vi.mocked(getPagesByUserIds).mockResolvedValue([arjunPage] as never);
	vi.mocked(getProposalsForMatches).mockResolvedValue([]);
	vi.mocked(countUnreadByMatch).mockResolvedValue(new Map());
});

async function summaryWith(notes: ReturnType<typeof marginNoteRow>[]) {
	vi.mocked(getMarginNotes).mockResolvedValue(notes);
	const [summary] = await summarizeLetters({
		letters: [{ ...letterRow(), match: null }],
		candidateUserId: "user-priya",
		organizationId: "org-priya",
	});
	return summary;
}

describe("summarizeLetters", () => {
	it("marks a letter when family reacted beside its page", async () => {
		expect((await summaryWith([marginNoteRow()]))?.hasFamilyReaction).toBe(true);
	});

	it("does not count the candidate's own private reaction as family's", async () => {
		const own = marginNoteRow({ authorUserId: "user-priya", authorLabel: "Priya" });
		expect((await summaryWith([own]))?.hasFamilyReaction).toBe(false);
	});
});
