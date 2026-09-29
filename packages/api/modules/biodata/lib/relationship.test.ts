import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", () => ({
	getLettersBetweenUsers: vi.fn(),
}));

import { getLettersBetweenUsers } from "@repo/database";

import { letterRow, matchRow, pageRow } from "../../../lib/test-fixtures";
import { relationshipFromLetters, resolveRelationship } from "./relationship";

const mine = letterRow({ id: "mine", fromUserId: "user-priya", toUserId: "user-arjun" });
const theirs = letterRow({ id: "theirs", fromUserId: "user-arjun", toUserId: "user-priya" });

describe("relationshipFromLetters", () => {
	it("is an introduction as soon as there is a match", () => {
		expect(
			relationshipFromLetters({ myLetter: mine, theirLetter: null, match: matchRow() }),
		).toBe("introduced");
	});

	it("prefers their letter to mine, so after-note photos open to the one they wrote to", () => {
		expect(relationshipFromLetters({ myLetter: mine, theirLetter: theirs, match: null })).toBe(
			"wrote_to_me",
		);
		expect(relationshipFromLetters({ myLetter: mine, theirLetter: null, match: null })).toBe(
			"i_wrote",
		);
		expect(relationshipFromLetters({ myLetter: null, theirLetter: null, match: null })).toBe(
			"stranger",
		);
	});
});

describe("resolveRelationship", () => {
	const arjunPage = {
		...pageRow({ id: "page-arjun", organizationId: "org-arjun", userId: "user-arjun" }),
		photos: [],
	};

	beforeEach(() => {
		vi.mocked(getLettersBetweenUsers).mockReset();
	});

	it("knows your own page and your household's page without reading letters", async () => {
		const self = await resolveRelationship({
			viewerUserId: "user-arjun",
			viewerOrganizationId: "org-arjun",
			viewerCandidateUserId: "user-arjun",
			target: arjunPage,
		});
		const household = await resolveRelationship({
			viewerUserId: "user-arjun-mother",
			viewerOrganizationId: "org-arjun",
			viewerCandidateUserId: "user-arjun",
			target: arjunPage,
		});

		expect(self.relationship).toBe("self");
		expect(household.relationship).toBe("household");
		expect(getLettersBetweenUsers).not.toHaveBeenCalled();
	});

	it("treats a reader with no candidate of their own as a stranger", async () => {
		const result = await resolveRelationship({
			viewerUserId: "user-nasreen",
			viewerOrganizationId: "org-ali",
			viewerCandidateUserId: null,
			target: arjunPage,
		});

		expect(result.relationship).toBe("stranger");
		expect(getLettersBetweenUsers).not.toHaveBeenCalled();
	});

	it("reads the letters between the two candidates", async () => {
		vi.mocked(getLettersBetweenUsers).mockResolvedValueOnce([{ ...mine, match: null }]);

		const result = await resolveRelationship({
			viewerUserId: "user-priya",
			viewerOrganizationId: "org-priya",
			viewerCandidateUserId: "user-priya",
			target: arjunPage,
		});

		expect(getLettersBetweenUsers).toHaveBeenCalledWith("user-priya", "user-arjun");
		expect(result.relationship).toBe("i_wrote");
		expect(result.myLetter?.id).toBe("mine");
	});
});
