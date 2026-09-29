import type {
	BiodataPhotoRow,
	BiodataProfileRow,
	CallProposalRow,
	InterestRow,
	MarginNoteRow,
	MatchRow,
	PhotoVisibility,
} from "@repo/database";

/**
 * Complete, typed rows for unit tests of the pure domain logic (no database). Based on the
 * seed's Priya Sharma (spec.md §14) so the values read like real pages.
 */
export const FIXTURE_CREATED_AT = new Date("2026-09-01T12:00:00Z");

export function pageRow(overrides: Partial<BiodataProfileRow> = {}): BiodataProfileRow {
	return {
		id: "page-priya",
		organizationId: "org-priya",
		userId: "user-priya",
		handle: "prs4821",
		status: "active",
		isActive: true,
		displayName: "Priya",
		fullName: "Priya Sharma",
		gender: "female",
		dateOfBirth: "1997-03-14",
		height: 163,
		religion: "hindu",
		sect: null,
		practice: "moderately",
		community: "Punjabi",
		motherTongue: "Punjabi",
		languages: ["Hindi", "English"],
		maritalStatus: "never_married",
		hasChildren: false,
		education: "professional",
		university: "Rutgers University",
		profession: "Pharmacist",
		employer: "Hackensack Meridian Health",
		incomeRange: "75k_100k",
		familyType: "nuclear",
		familyValues: "moderate",
		fatherOccupation: "Retired civil engineer",
		motherOccupation: "Schoolteacher",
		siblings: "One younger brother",
		nativePlace: "Jalandhar, Punjab",
		aboutFamily: "We are a close family who eat dinner together on Sundays.",
		diet: "veg",
		smoking: "never",
		drinking: "never",
		aboutMe: "I work long shifts and cook on my days off.",
		lookingFor: "Someone kind, who likes a full house.",
		createdBy: "self",
		location: "Edison, New Jersey",
		country: "US",
		timeZone: "America/New_York",
		residency: "citizen",
		birthTime: "06:45",
		birthPlace: "Jalandhar",
		manglik: "no",
		invocation: "shri_ganesh",
		invocationText: null,
		pageLanguage: "en",
		fieldVisibility: {},
		verification: "email",
		isVerified: true,
		contactPhone: "+17325550199",
		familyContactName: "Sunita Sharma",
		familyContactPhone: "+17325550100",
		profilePhoto: null,
		claimedAt: FIXTURE_CREATED_AT,
		publishedAt: FIXTURE_CREATED_AT,
		pausedAt: null,
		closedAt: null,
		closedReason: null,
		closingStory: null,
		createdAt: FIXTURE_CREATED_AT,
		updatedAt: FIXTURE_CREATED_AT,
		...overrides,
	};
}

export function photoRow(
	visibility: PhotoVisibility,
	overrides: Partial<BiodataPhotoRow> = {},
): BiodataPhotoRow {
	const id = overrides.id ?? `photo-${visibility}`;
	return {
		id,
		profileId: "page-priya",
		organizationId: "org-priya",
		storageKey: `clear/${id}.jpg`,
		veilKey: `veil/${id}.jpg`,
		width: 800,
		height: 1000,
		position: 0,
		visibility,
		createdAt: FIXTURE_CREATED_AT,
		...overrides,
	};
}

export function letterRow(overrides: Partial<InterestRow> = {}): InterestRow {
	return {
		id: "letter-arjun",
		fromUserId: "user-arjun",
		toUserId: "user-priya",
		fromOrganizationId: "org-arjun",
		toOrganizationId: "org-priya",
		status: "pending",
		message:
			"Your page says your family is from Jalandhar. Mine is from Ludhiana, and I'd like to hear more.",
		isPriority: false,
		priorityUntil: null,
		creditsSpent: 0,
		bidAmount: 0,
		suggestionId: null,
		safetyFlag: null,
		declineMode: null,
		declineNote: null,
		respondedAt: null,
		closedAt: null,
		createdAt: FIXTURE_CREATED_AT,
		updatedAt: FIXTURE_CREATED_AT,
		...overrides,
	};
}

export function matchRow(overrides: Partial<MatchRow> = {}): MatchRow {
	return {
		id: "match-arjun-priya",
		interestId: "letter-arjun",
		pairKey: "user-arjun:user-priya",
		userAId: "user-arjun",
		organizationAId: "org-arjun",
		userBId: "user-priya",
		organizationBId: "org-priya",
		stage: "introduced",
		sealsSeenByAAt: null,
		sealsSeenByBAt: null,
		phoneSharedByA: false,
		phoneSharedByB: false,
		familySharedByA: false,
		familySharedByB: false,
		lastMessageAt: null,
		closedAt: null,
		closedByUserId: null,
		closingNote: null,
		closeReason: null,
		createdAt: FIXTURE_CREATED_AT,
		updatedAt: FIXTURE_CREATED_AT,
		...overrides,
	};
}

export function proposalRow(overrides: Partial<CallProposalRow> = {}): CallProposalRow {
	return {
		id: "proposal-1",
		matchId: "match-arjun-priya",
		proposedByUserId: null,
		slots: [
			new Date("2026-09-03T00:00:00Z"),
			new Date("2026-09-04T00:00:00Z"),
			new Date("2026-09-05T00:00:00Z"),
		],
		timeZoneA: "America/Toronto",
		timeZoneB: "America/New_York",
		availabilityA: [],
		availabilityB: [],
		status: "open",
		bookedSlot: null,
		note: null,
		createdAt: FIXTURE_CREATED_AT,
		answeredAt: null,
		...overrides,
	};
}

/** A pencil note in Priya's household margin beside Arjun's page, by her mother Sunita ("Ammi"). */
export function marginNoteRow(overrides: Partial<MarginNoteRow> = {}): MarginNoteRow {
	return {
		id: "note-ammi",
		organizationId: "org-priya",
		profileId: "page-arjun",
		authorUserId: "user-sunita",
		familyLinkId: null,
		authorLabel: "Ammi",
		reaction: "proceed",
		text: null,
		createdAt: FIXTURE_CREATED_AT,
		updatedAt: FIXTURE_CREATED_AT,
		...overrides,
	};
}
