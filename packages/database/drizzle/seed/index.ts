/**
 * Rishta demo seed (spec.md §14). Run with `pnpm --filter @repo/database seed`.
 *
 * - Idempotent: deletes and recreates everything under @demo.rishta.test.
 * - Passwords come from SEED_DEMO_PASSWORD, or one is generated and printed.
 * - Dates are relative to the run; each household's "today" is its own local day.
 * - Never run it against production.
 */
import { createHash, randomBytes } from "node:crypto";

import { eq, inArray, like, or } from "drizzle-orm";

import { db } from "../client";
import {
	generateHandle,
	WELCOME_CREDITS,
	type FitReason,
	type FitVerdict,
	type FolioPageState,
	type LetterStatus,
	type PageLanguage,
	type PassReason,
	type SafetyFlag,
	type TranslatedPage,
} from "../domain";
import { toPairKey } from "../queries/matches";
import {
	account,
	biodataPhoto,
	biodataProfile,
	biodataTranslation,
	blockUser,
	callProposal,
	creditLedger,
	familyLink,
	folio,
	folioPage,
	householdSetting,
	interest,
	invitation,
	marginNote,
	match,
	member,
	message,
	notification,
	organization,
	partnerPreference,
	profileView,
	purchase,
	report,
	shortlist,
	user,
	wallet,
} from "../schema/postgres";
import {
	addDays,
	ago,
	currentReleaseDate,
	dateOfBirthForAge,
	earlierToday,
	fromNow,
	generatePassword,
	hashPassword,
	localDate,
	nextWeekdayAt,
	portraitKeys,
	SEED_NOW,
	zoned,
} from "./lib";
import {
	ADMIN,
	CANDIDATES,
	DEMO_EMAIL_DOMAIN,
	demoEmail,
	HELPERS,
	type CandidateSeed,
} from "./people";

const APP_URL = process.env.NEXT_PUBLIC_SAAS_URL ?? "http://localhost:3000";

interface Household {
	seed: CandidateSeed;
	organizationId: string;
	userId: string | null;
	pageId: string;
	handle: string;
	walletId: string;
	timeZone: string;
}

const users = new Map<string, string>();
const households = new Map<string, Household>();

function household(key: string): Household {
	const found = households.get(key);
	if (!found) {
		throw new Error(`Unknown household ${key}`);
	}
	return found;
}

function candidateId(key: string): string {
	const id = household(key).userId;
	if (!id) {
		throw new Error(`${key} has no candidate account`);
	}
	return id;
}

function userId(key: string): string {
	const id = users.get(key);
	if (!id) {
		throw new Error(`Unknown user ${key}`);
	}
	return id;
}

// ===== Guard and clean-up =====

function assertNotProduction() {
	if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
		throw new Error("Refusing to seed demo data into a production environment.");
	}
}

async function removeDemoData() {
	const demoUsers = await db
		.select({ id: user.id })
		.from(user)
		.where(like(user.email, `%@${DEMO_EMAIL_DOMAIN}`));
	const demoUserIds = demoUsers.map((row) => row.id);
	const demoSlugs = CANDIDATES.map((candidate) => candidate.slug);

	const memberships =
		demoUserIds.length > 0
			? await db
					.select({ organizationId: member.organizationId })
					.from(member)
					.where(inArray(member.userId, demoUserIds))
			: [];
	const slugged = await db
		.select({ id: organization.id })
		.from(organization)
		.where(inArray(organization.slug, demoSlugs));
	const organizationIds = Array.from(
		new Set([...memberships.map((row) => row.organizationId), ...slugged.map((row) => row.id)]),
	);

	if (demoUserIds.length > 0) {
		await db
			.delete(report)
			.where(
				or(
					inArray(report.reporterUserId, demoUserIds),
					inArray(report.reportedUserId, demoUserIds),
				),
			);
	}
	if (organizationIds.length > 0) {
		await db.delete(organization).where(inArray(organization.id, organizationIds));
	}
	if (demoUserIds.length > 0) {
		await db.delete(user).where(inArray(user.id, demoUserIds));
	}

	return { users: demoUserIds.length, households: organizationIds.length };
}

// ===== Accounts and households =====

async function createAccount(
	key: string,
	name: string,
	passwordHash: string,
	role: string | null = null,
) {
	const createdAt = ago({ days: 90 });
	const [row] = await db
		.insert(user)
		.values({
			name,
			email: demoEmail(key),
			emailVerified: true,
			role,
			onboardingComplete: true,
			locale: "en",
			createdAt,
			updatedAt: createdAt,
		})
		.returning({ id: user.id });
	if (!row) {
		throw new Error(`Could not create ${key}`);
	}
	await db.insert(account).values({
		accountId: row.id,
		providerId: "credential",
		userId: row.id,
		password: passwordHash,
		createdAt,
		updatedAt: createdAt,
	});
	users.set(key, row.id);
	return row.id;
}

const usedHandles = new Set<string>();

function uniqueHandle() {
	let handle = generateHandle();
	while (usedHandles.has(handle)) {
		handle = generateHandle();
	}
	usedHandles.add(handle);
	return handle;
}

/** Fixed page versions, so the precomputed translations match `sourceUpdatedAt`. */
const PAGE_UPDATED_AT = new Map<string, Date>();

async function createHousehold(seed: CandidateSeed) {
	const candidateUserId = seed.claimed ? (users.get(seed.key) ?? null) : null;
	const publishedAt =
		seed.status === "draft" || seed.status === "awaiting_claim"
			? null
			: ago({ days: seed.publishedDaysAgo });
	const createdAt = ago({ days: seed.publishedDaysAgo + 5 });
	const updatedAt = ago({ days: Math.max(seed.publishedDaysAgo - 1, 0), hours: 3 });
	PAGE_UPDATED_AT.set(seed.key, updatedAt);

	const [org] = await db
		.insert(organization)
		.values({
			name: seed.accountName.split(" ")[0] ?? seed.accountName,
			slug: seed.slug,
			createdAt,
		})
		.returning({ id: organization.id });
	if (!org) {
		throw new Error(`Could not create household ${seed.slug}`);
	}

	if (candidateUserId) {
		await db
			.insert(member)
			.values({ organizationId: org.id, userId: candidateUserId, role: "owner", createdAt });
	}

	await db.insert(householdSetting).values({
		organizationId: org.id,
		candidateRelation: seed.relation,
		pendingCandidateEmail: seed.claimed ? null : demoEmail(seed.key),
		familyEditsPage: !seed.claimed,
		familySeesIntroductions: seed.familySeesIntroductions ?? false,
		familyLanguage: seed.familyLanguage ?? "hi",
		readIncognito: seed.readIncognito ?? false,
		memberLabels: {},
	});

	const { age, birthday, ...pageFields } = seed.page;
	const handle = uniqueHandle();
	const [page] = await db
		.insert(biodataProfile)
		.values({
			...pageFields,
			organizationId: org.id,
			userId: candidateUserId,
			handle,
			status: seed.status,
			isActive: seed.status === "active",
			dateOfBirth: dateOfBirthForAge(age, birthday[0], birthday[1]),
			verification: seed.claimed ? (pageFields.verification ?? "email") : "none",
			isVerified: seed.claimed,
			claimedAt: seed.claimed ? createdAt : null,
			publishedAt,
			pausedAt: seed.status === "paused" ? ago({ days: 2 }) : null,
			closedAt: seed.status === "closed" ? ago({ days: 6 }) : null,
			createdAt,
			updatedAt,
		})
		.returning({ id: biodataProfile.id });
	if (!page) {
		throw new Error(`Could not create page for ${seed.key}`);
	}

	if (seed.photos.length > 0) {
		await db.insert(biodataPhoto).values(
			seed.photos.map((visibility, position) => ({
				profileId: page.id,
				organizationId: org.id,
				...portraitKeys(seed.key, position),
				position,
				visibility,
				createdAt,
			})),
		);
	}

	await db.insert(partnerPreference).values({
		...seed.preference,
		organizationId: org.id,
		userId: candidateUserId,
		willingToRelocate: seed.preference.relocation
			? seed.preference.relocation === "open"
			: null,
		requiresCitizenship: seed.preference.residencyRequirement
			? seed.preference.residencyRequirement === "citizen_or_pr"
			: null,
		completedAt: seed.preference.completedAt === null ? null : createdAt,
		quizComplete: seed.preference.completedAt !== null,
	});

	const [walletRow] = await db
		.insert(wallet)
		.values({
			organizationId: org.id,
			userId: candidateUserId,
			credits: WELCOME_CREDITS,
			createdAt,
		})
		.returning({ id: wallet.id });
	if (!walletRow) {
		throw new Error(`Could not create wallet for ${seed.key}`);
	}
	await db.insert(creditLedger).values({
		walletId: walletRow.id,
		organizationId: org.id,
		delta: WELCOME_CREDITS,
		reason: "welcome",
		createdByUserId: candidateUserId,
		createdAt,
	});

	households.set(seed.key, {
		seed,
		organizationId: org.id,
		userId: candidateUserId,
		pageId: page.id,
		handle,
		walletId: walletRow.id,
		timeZone: seed.page.timeZone,
	});
}

async function addHelpers() {
	const labels = new Map<string, Record<string, string>>();

	for (const helper of HELPERS) {
		const home = household(helper.household);
		await db.insert(member).values({
			organizationId: home.organizationId,
			userId: userId(helper.key),
			role: helper.role,
			createdAt: ago({ days: home.seed.publishedDaysAgo + 4 }),
		});
		const current = labels.get(home.organizationId) ?? {};
		current[userId(helper.key)] = helper.label;
		labels.set(home.organizationId, current);
		await db
			.update(user)
			.set({ lastActiveOrganizationId: home.organizationId })
			.where(eq(user.id, userId(helper.key)));
	}

	for (const [organizationId, memberLabels] of labels) {
		await db
			.update(householdSetting)
			.set({ memberLabels })
			.where(eq(householdSetting.organizationId, organizationId));
	}

	for (const home of households.values()) {
		if (home.userId) {
			await db
				.update(user)
				.set({ lastActiveOrganizationId: home.organizationId })
				.where(eq(user.id, home.userId));
		}
	}
}

// ===== Letters, introductions and correspondence =====

interface LetterSeed {
	from: string;
	to: string;
	createdAt: Date;
	note: string;
	status?: LetterStatus;
	isPriority?: boolean;
	priorityUntil?: Date | null;
	creditsSpent?: number;
	safetyFlag?: SafetyFlag | null;
	declineMode?: "kind_note" | "quiet" | null;
	declineNote?: string | null;
	respondedAt?: Date | null;
	closedAt?: Date | null;
}

async function createLetter(seed: LetterSeed) {
	const from = household(seed.from);
	const to = household(seed.to);
	const [row] = await db
		.insert(interest)
		.values({
			fromUserId: candidateId(seed.from),
			toUserId: candidateId(seed.to),
			fromOrganizationId: from.organizationId,
			toOrganizationId: to.organizationId,
			status: seed.status ?? "pending",
			message: seed.note,
			isPriority: seed.isPriority ?? false,
			priorityUntil: seed.priorityUntil ?? null,
			creditsSpent: seed.creditsSpent ?? 0,
			safetyFlag: seed.safetyFlag ?? null,
			declineMode: seed.declineMode ?? null,
			declineNote: seed.declineNote ?? null,
			respondedAt: seed.respondedAt ?? null,
			closedAt: seed.closedAt ?? null,
			createdAt: seed.createdAt,
			updatedAt: seed.respondedAt ?? seed.closedAt ?? seed.createdAt,
		})
		.returning({ id: interest.id });
	if (!row) {
		throw new Error(`Could not create letter ${seed.from} → ${seed.to}`);
	}
	return row.id;
}

interface IntroductionSeed {
	letterId: string;
	sender: string;
	acceptor: string;
	acceptedAt: Date;
	stage?: "introduced" | "call_booked" | "families" | "closed";
	sealsSeenBySender?: Date | null;
	phoneSharedByAcceptor?: boolean;
	closed?: { at: Date; by: string; note: string; reason: "search_closed" | "not_a_fit" };
}

async function createIntroduction(seed: IntroductionSeed) {
	const sender = household(seed.sender);
	const acceptor = household(seed.acceptor);
	const [row] = await db
		.insert(match)
		.values({
			interestId: seed.letterId,
			pairKey: toPairKey(candidateId(seed.sender), candidateId(seed.acceptor)),
			userAId: candidateId(seed.sender),
			organizationAId: sender.organizationId,
			userBId: candidateId(seed.acceptor),
			organizationBId: acceptor.organizationId,
			stage: seed.stage ?? "introduced",
			sealsSeenByAAt:
				seed.sealsSeenBySender === undefined ? seed.acceptedAt : seed.sealsSeenBySender,
			sealsSeenByBAt: seed.acceptedAt,
			phoneSharedByB: seed.phoneSharedByAcceptor ?? false,
			closedAt: seed.closed?.at ?? null,
			closedByUserId: seed.closed ? candidateId(seed.closed.by) : null,
			closingNote: seed.closed?.note ?? null,
			closeReason: seed.closed?.reason ?? null,
			createdAt: seed.acceptedAt,
			updatedAt: seed.closed?.at ?? seed.acceptedAt,
		})
		.returning({ id: match.id });
	if (!row) {
		throw new Error("Could not create introduction");
	}
	return row.id;
}

/** Three evenings at 8:00 pm in the sender's zone (both pairs here share an evening). */
function eveningsFrom(timeZone: string, firstDayOffset: number) {
	const today = localDate(SEED_NOW, timeZone);
	return [0, 1, 2].map((index) =>
		zoned(addDays(today, firstDayOffset + index), 20, index === 1 ? 30 : 0, timeZone),
	);
}

async function writeMessages(
	matchId: string,
	pair: [string, string],
	lines: Array<{ from: 0 | 1; at: Date; text: string; read?: boolean }>,
) {
	const ids = [candidateId(pair[0]), candidateId(pair[1])] as const;
	await db.insert(message).values(
		lines.map((line) => ({
			matchId,
			fromUserId: ids[line.from],
			toUserId: ids[line.from === 0 ? 1 : 0],
			content: line.text,
			read: line.read ?? true,
			createdAt: line.at,
		})),
	);
	const last = lines[lines.length - 1];
	if (last) {
		await db.update(match).set({ lastMessageAt: last.at }).where(eq(match.id, matchId));
	}
}

// ===== Folios =====

function reason(
	key: FitReason["key"],
	verdict: FitVerdict,
	params: Record<string, string> = {},
): FitReason {
	return { key, verdict, params };
}

const EDISON = "Edison, New Jersey";
const PRIYA_CORE = (age: string) => [
	reason("timeline", "fits", { mine: "1_year", theirs: "1_year", same: "true" }),
	reason("age", "fits", { age }),
	reason("marital_status", "fits", { status: "never_married" }),
];

async function createFolio(params: {
	household: string;
	releaseDate: string;
	size: number;
	pages: Array<{
		key: string;
		state: FolioPageState;
		reasons: FitReason[];
		passReason?: PassReason;
		seenBefore?: boolean;
	}>;
}) {
	const home = household(params.household);
	const releasedAt = zoned(params.releaseDate, 19, 0, home.timeZone);
	const generatedAt = new Date(
		Math.min(releasedAt.getTime() + 20 * 60 * 1000, SEED_NOW.getTime() - 60 * 1000),
	);
	const [row] = await db
		.insert(folio)
		.values({
			organizationId: home.organizationId,
			releaseDate: params.releaseDate,
			size: params.size,
			generatedAt,
		})
		.returning({ id: folio.id });
	if (!row) {
		throw new Error("Could not create folio");
	}
	await db.insert(folioPage).values(
		params.pages.map((page, index) => ({
			folioId: row.id,
			organizationId: home.organizationId,
			profileId: household(page.key).pageId,
			position: index + 1,
			reasons: page.reasons,
			score: (params.pages.length - index) * 10,
			state: page.state,
			passReason: page.passReason ?? null,
			seenBefore: page.seenBefore ?? false,
			answeredAt: page.state === "unread" || page.state === "read" ? null : generatedAt,
			createdAt: generatedAt,
		})),
	);
}

// ===== Family links =====

async function createFamilyLink(params: {
	household: string;
	createdBy: string;
	page: string;
	letterId?: string;
	recipientLabel: string;
	language: PageLanguage;
	createdAt: Date;
	expiresAt: Date;
	revokedAt?: Date;
	openCount?: number;
}) {
	const token = randomBytes(32).toString("base64url");
	const [row] = await db
		.insert(familyLink)
		.values({
			organizationId: household(params.household).organizationId,
			createdByUserId: userId(params.createdBy),
			profileId: household(params.page).pageId,
			letterId: params.letterId ?? null,
			tokenHash: createHash("sha256").update(token).digest("hex"),
			recipientLabel: params.recipientLabel,
			language: params.language,
			expiresAt: params.expiresAt,
			revokedAt: params.revokedAt ?? null,
			openCount: params.openCount ?? 0,
			firstOpenedAt: params.openCount
				? new Date(params.createdAt.getTime() + 60 * 60 * 1000)
				: null,
			lastOpenedAt: params.openCount ? ago({ days: 1 }) : null,
			createdAt: params.createdAt,
		})
		.returning({ id: familyLink.id });
	if (!row) {
		throw new Error("Could not create family link");
	}
	return { id: row.id, url: `${APP_URL}/f/${token}` };
}

// ===== Translations (static, so family links work with no AI key) =====

const ROHAN_HINDI: TranslatedPage = {
	fields: [
		{ key: "profession", value: "शहरी योजनाकार" },
		{ key: "university", value: "कोलंबिया यूनिवर्सिटी" },
		{ key: "fatherOccupation", value: "सेवानिवृत्त एयरलाइन पायलट" },
		{ key: "motherOccupation", value: "पंजाबी खाना सिखाने का स्कूल चलाती हैं" },
		{ key: "siblings", value: "एक बड़े भाई, विवाहित, न्यू जर्सी में" },
		{ key: "nativePlace", value: "अमृतसर, पंजाब" },
		{ key: "community", value: "पंजाबी" },
		{ key: "motherTongue", value: "पंजाबी" },
	],
	about: "मैं न्यूयॉर्क शहर के लिए साइकिल लेन और पार्क की योजना बनाता हूँ, और रविवार के भीड़ भरे बाज़ार में सबसे ज़्यादा खुश रहता हूँ। मेरी माँ ने आधे क्वींस को सरसों का साग बनाना सिखाया है।",
	aboutFamily:
		"मेरे माता-पिता क्वींस में रहते हैं और रिटायर होने पर न्यू जर्सी में मेरे भाई के पास जाने की सोच रहे हैं।",
	lookingFor: "कोई ऐसी जो एक साल के भीतर शादी करना चाहे और दोनों परिवारों के पास घर बसाना चाहे।",
};

const ARJUN_PUNJABI: TranslatedPage = {
	fields: [
		{ key: "profession", value: "ਫੈਮਿਲੀ ਫਿਜ਼ੀਸ਼ੀਅਨ" },
		{ key: "university", value: "ਮੈਕਮਾਸਟਰ ਯੂਨੀਵਰਸਿਟੀ (ਐਮਡੀ)" },
		{ key: "fatherOccupation", value: "ਸੇਵਾਮੁਕਤ ਸਿਵਲ ਇੰਜੀਨੀਅਰ" },
		{ key: "motherOccupation", value: "ਸਕੂਲ ਅਧਿਆਪਕਾ" },
		{ key: "siblings", value: "ਇੱਕ ਭੈਣ, ਵਿਆਹੀ ਹੋਈ, ਬਰੈਂਪਟਨ ਵਿੱਚ" },
		{ key: "nativePlace", value: "ਲੁਧਿਆਣਾ, ਪੰਜਾਬ" },
		{ key: "community", value: "ਪੰਜਾਬੀ" },
		{ key: "motherTongue", value: "ਪੰਜਾਬੀ" },
	],
	about: "ਮੈਂ ਸਕਾਰਬਰੋ ਵਿੱਚ ਫੈਮਿਲੀ ਫਿਜ਼ੀਸ਼ੀਅਨ ਹਾਂ ਅਤੇ ਐਤਵਾਰ ਨੂੰ ਖਾਣਾ ਮੈਂ ਹੀ ਬਣਾਉਂਦਾ ਹਾਂ। ਮੈਂ ਤਬਲਾ ਵਜਾਉਂਦਾ ਹਾਂ, ਬਹੁਤ ਵਧੀਆ ਨਹੀਂ, ਅਤੇ ਖੁਸ਼ਵੰਤ ਸਿੰਘ ਦਾ ਲਿਖਿਆ ਸਭ ਕੁਝ ਪੜ੍ਹਦਾ ਹਾਂ।",
	aboutFamily:
		"ਮੇਰੇ ਮਾਤਾ-ਪਿਤਾ 1998 ਵਿੱਚ ਟੋਰਾਂਟੋ ਆਏ ਸਨ। ਉਹ ਅਜੇ ਵੀ ਇੰਨਾ ਵੱਡਾ ਸਬਜ਼ੀਆਂ ਦਾ ਬਗੀਚਾ ਰੱਖਦੇ ਹਨ ਕਿ ਪੂਰੀ ਗਲੀ ਲਈ ਕਾਫ਼ੀ ਹੋਵੇ।",
	lookingFor: "ਇੱਕ ਸਾਲ ਦੇ ਅੰਦਰ ਵਿਆਹ ਦੀ ਉਮੀਦ ਹੈ। ਸਹੀ ਵਿਅਕਤੀ ਅਤੇ ਉਸਦੇ ਪਰਿਵਾਰ ਲਈ ਮੈਂ ਅਮਰੀਕਾ ਆਉਣ ਲਈ ਤਿਆਰ ਹਾਂ।",
};

async function createTranslation(page: string, language: PageLanguage, content: TranslatedPage) {
	const sourceUpdatedAt = PAGE_UPDATED_AT.get(page);
	if (!sourceUpdatedAt) {
		throw new Error(`No page version for ${page}`);
	}
	await db.insert(biodataTranslation).values({
		profileId: household(page).pageId,
		language,
		sourceUpdatedAt,
		content,
		model: "seed (human translation)",
	});
}

// ===== The scenario =====

async function seedLetters() {
	const priyaTz = household("priya").timeZone;
	const omarTz = household("omar").timeZone;

	// Waiting for Priya's answer (4).
	const rahulLetter = await createLetter({
		from: "rahul",
		to: "priya",
		createdAt: ago({ days: 12, hours: 2 }),
		note: "Your page mentions your nani visiting every winter. Mine lives with us in Seattle and has opinions about everyone's cooking. I'd like to hear what your family's Sundays are like.",
	});
	const arjunSentAt = ago({ days: 1, hours: 2 });
	const arjunLetter = await createLetter({
		from: "arjun",
		to: "priya",
		createdAt: arjunSentAt,
		note: "Your page says your family is from Jalandhar; mine is from Ludhiana, so our parents will have plenty to argue about. I'd like to hear about the pharmacy you want to open one day.",
		isPriority: true,
		priorityUntil: new Date(arjunSentAt.getTime() + 48 * 60 * 60 * 1000),
		creditsSpent: 1,
	});
	const karanLetter = await createLetter({
		from: "karan",
		to: "priya",
		createdAt: ago({ days: 1, hours: 5 }),
		note: "You seem like a genuine person. I am stuck in London with a bank problem and could use a small loan until my transfer clears. Let's move to WhatsApp so I can explain properly.",
		safetyFlag: {
			category: "money",
			categories: ["money", "off_platform"],
			reason: "asks about money; asks to move off Rishta before you've spoken",
			source: "rules",
		},
	});
	const omarLetter = await createLetter({
		from: "omar",
		to: "priya",
		createdAt: earlierToday(40, omarTz),
		note: "Your page says you run on weekend mornings; I coach a kids' football team at the same hour. I'd like to know what a good Sunday looks like for your family.",
	});

	// Introductions (3).
	const harpreetLetter = await createLetter({
		from: "priya",
		to: "harpreet",
		createdAt: ago({ days: 3, hours: 1 }),
		note: "Your page says you do seva at the gurdwara every Sunday; my family volunteers at our mandir's kitchen too. I'd like to hear how your brothers and you divide the business.",
		status: "accepted",
		respondedAt: earlierToday(90, priyaTz),
	});
	const harpreetMatch = await createIntroduction({
		letterId: harpreetLetter,
		sender: "priya",
		acceptor: "harpreet",
		acceptedAt: earlierToday(90, priyaTz),
		// The break has not played on Priya's side yet: it plays on her first open.
		sealsSeenBySender: null,
	});
	await db.insert(callProposal).values({
		matchId: harpreetMatch,
		proposedByUserId: null,
		slots: eveningsFrom(priyaTz, 1),
		timeZoneA: priyaTz,
		timeZoneB: household("harpreet").timeZone,
		createdAt: earlierToday(90, priyaTz),
	});

	const nikhilLetter = await createLetter({
		from: "nikhil",
		to: "priya",
		createdAt: ago({ days: 4, hours: 3 }),
		note: "Your page says you read Amrita Pritam; my mother sings her poems in Telugu translation, which sounds unlikely but works. I'd like to know what you're reading now.",
		status: "accepted",
		respondedAt: ago({ days: 2, hours: 1 }),
	});
	const nikhilMatch = await createIntroduction({
		letterId: nikhilLetter,
		sender: "nikhil",
		acceptor: "priya",
		acceptedAt: ago({ days: 2, hours: 1 }),
	});
	await db.insert(callProposal).values({
		matchId: nikhilMatch,
		proposedByUserId: null,
		slots: eveningsFrom(household("nikhil").timeZone, 1),
		timeZoneA: household("nikhil").timeZone,
		timeZoneB: priyaTz,
		// Nikhil ticked the second evening; Priya hasn't answered yet.
		availabilityA: [1],
		availabilityB: [],
		createdAt: ago({ days: 2, hours: 1 }),
	});
	await writeMessages(
		nikhilMatch,
		["nikhil", "priya"],
		[
			{
				from: 0,
				at: ago({ days: 2 }),
				text: "Thank you for saying yes. Sunday evening would suit my parents too, if you'd like them to say hello at the end.",
			},
			{
				from: 1,
				at: ago({ days: 1, hours: 23 }),
				text: "That's kind of them. I'd like that. Is Sunday your quiet day as well?",
			},
			{
				from: 0,
				at: ago({ days: 1, hours: 4 }),
				text: "It is, apart from a long run in the morning. I've ticked the Saturday evening too, in case it's easier.",
			},
			{
				from: 1,
				at: ago({ hours: 20 }),
				text: "Let me look at the week and tick what works. Tell me about the run.",
			},
		],
	);

	const sameerLetter = await createLetter({
		from: "priya",
		to: "sameer",
		createdAt: ago({ days: 10 }),
		note: "Your page says you read Marathi theatre for fun; my father drags us to every Punjabi play in Edison. I'd like to know which one you'd take me to first.",
		status: "accepted",
		respondedAt: ago({ days: 9 }),
	});
	const sameerMatch = await createIntroduction({
		letterId: sameerLetter,
		sender: "priya",
		acceptor: "sameer",
		acceptedAt: ago({ days: 9 }),
		stage: "call_booked",
		phoneSharedByAcceptor: true,
	});
	const thursday = nextWeekdayAt(4, 20, 0, priyaTz);
	await db.insert(callProposal).values({
		matchId: sameerMatch,
		proposedByUserId: null,
		slots: [
			thursday,
			new Date(thursday.getTime() + 24.5 * 60 * 60 * 1000),
			new Date(thursday.getTime() + 47 * 60 * 60 * 1000),
		],
		timeZoneA: priyaTz,
		timeZoneB: household("sameer").timeZone,
		availabilityA: [0, 2],
		availabilityB: [0],
		status: "booked",
		bookedSlot: thursday,
		createdAt: ago({ days: 9 }),
		answeredAt: ago({ days: 7 }),
	});
	await writeMessages(
		sameerMatch,
		["priya", "sameer"],
		[
			{
				from: 1,
				at: ago({ days: 8, hours: 20 }),
				text: "Thank you for your note. The first play would be Natsamrat, and I'd warn you it is three hours long.",
			},
			{
				from: 0,
				at: ago({ days: 8, hours: 18 }),
				text: "Three hours is fine if there's a good interval snack.",
			},
			{
				from: 1,
				at: ago({ days: 8, hours: 2 }),
				text: "There is always vada pav. I ticked Thursday; does eight your time work?",
			},
			{
				from: 0,
				at: ago({ days: 7, hours: 23 }),
				text: "Thursday at eight works. My mother asked if your parents are in Pune or Houston.",
			},
			{
				from: 1,
				at: ago({ days: 7, hours: 20 }),
				text: "Pune, but they spend winters here. They'd be glad to speak to her after we've talked.",
			},
			{
				from: 0,
				at: ago({ days: 5 }),
				text: "I told her. She has already started a list of questions, so be warned.",
			},
			{
				from: 1,
				at: ago({ hours: 30 }),
				text: "I'd expect nothing less. Mine has a list too. Looking forward to Thursday.",
				read: false,
			},
			{
				from: 1,
				at: ago({ hours: 29 }),
				text: "One more thing: I shared my number in the letter, in case the video link gives trouble.",
				read: false,
			},
		],
	);

	// Priya's sealed notes (2).
	const devLetter = await createLetter({
		from: "priya",
		to: "dev",
		createdAt: earlierToday(25, priyaTz),
		note: "Your page says you volunteer at the Jain centre's Sunday school; I help at our mandir's weekend classes. I'd like to know what the children teach you in return.",
	});
	const vikramSentAt = ago({ days: 5, hours: 2 });
	const vikramLetter = await createLetter({
		from: "priya",
		to: "vikram",
		createdAt: vikramSentAt,
		note: "Your page says you study inflation; I watch it in the price of generic medicines every week. I'd like to hear about your family in Chennai and how you ended up in Chicago.",
		isPriority: true,
		priorityUntil: new Date(vikramSentAt.getTime() + 48 * 60 * 60 * 1000),
		creditsSpent: 1,
	});

	// Closed (4).
	await createLetter({
		from: "priya",
		to: "jin",
		createdAt: ago({ days: 20 }),
		note: "Your page says you cut documentaries between Seoul and Los Angeles. I'd like to know which story you are proudest of telling.",
		status: "declined",
		declineMode: "kind_note",
		declineNote:
			"Thank you for writing, Priya. I don't think we're the right match, and I wish you well in your search.",
		respondedAt: ago({ days: 18 }),
		closedAt: ago({ days: 18 }),
	});
	await createLetter({
		from: "priya",
		to: "david",
		createdAt: ago({ days: 25 }),
		note: "Your page says you make challah every Friday; my mother would like the recipe. I'd like to hear about your work with families in Brooklyn.",
		status: "declined",
		declineMode: "quiet",
		respondedAt: ago({ days: 22 }),
		closedAt: ago({ days: 22 }),
	});
	await createLetter({
		from: "andrei",
		to: "priya",
		createdAt: ago({ days: 15 }),
		note: "Your page says you run on weekend mornings. I swim in the Serpentine at the same hour, which my mother calls madness. I'd like to know what keeps you busy.",
		status: "declined",
		declineMode: "kind_note",
		declineNote:
			"Thank you for writing. I don't think we're the right match, and I wish you well in your search.",
		respondedAt: ago({ days: 14 }),
		closedAt: ago({ days: 14 }),
	});
	await createLetter({
		from: "neel",
		to: "priya",
		createdAt: ago({ days: 34 }),
		note: "We are both pharmacists in Edison, which means we have probably argued with the same insurance companies. I'd like to know how you chose the hospital side.",
		status: "closed",
		closedAt: ago({ days: 4 }),
	});

	// Omar: three notes sealed today (the daily limit), a closed introduction, a quiet decline.
	await createLetter({
		from: "omar",
		to: "zainab",
		createdAt: earlierToday(70, omarTz),
		note: "Your page says you love Urdu poetry and long walks; my grandmother recited Faiz on hers. I'd like to know which poet you'd recommend to a beginner.",
	});
	await createLetter({
		from: "omar",
		to: "amara",
		createdAt: earlierToday(55, omarTz),
		note: "Your page says you make better batteries by day and jollof on Fridays. I'd like to know which of the two is harder to get right.",
	});
	const mariaLetter = await createLetter({
		from: "omar",
		to: "maria",
		createdAt: ago({ days: 20 }),
		note: "Your page says you sing in your parish choir. I'd like to know which song you'd choose for a family gathering.",
		status: "accepted",
		respondedAt: ago({ days: 18 }),
	});
	const mariaMatch = await createIntroduction({
		letterId: mariaLetter,
		sender: "omar",
		acceptor: "maria",
		acceptedAt: ago({ days: 18 }),
		stage: "closed",
		closed: {
			at: ago({ days: 6 }),
			by: "maria",
			note: "I've closed my search. Thank you, and I wish you well.",
			reason: "search_closed",
		},
	});
	await writeMessages(
		mariaMatch,
		["omar", "maria"],
		[
			{
				from: 1,
				at: ago({ days: 17 }),
				text: "Thank you for your note. It would be a hymn my grandmother loved; I'll tell you which on a call.",
			},
			{
				from: 0,
				at: ago({ days: 16 }),
				text: "I'd like that. Are weekday evenings easier for you?",
			},
			{
				from: 1,
				at: ago({ days: 12 }),
				text: "Things have changed for me this week. I'll write properly soon.",
			},
		],
	);
	await createLetter({
		from: "fatima",
		to: "omar",
		createdAt: ago({ days: 9 }),
		note: "Your page says you coach children's football on Saturdays; my brothers would approve. I'd like to know what your family is like in Alexandria.",
		status: "declined",
		declineMode: "quiet",
		respondedAt: ago({ days: 8 }),
		closedAt: ago({ days: 8 }),
	});

	return {
		rahulLetter,
		arjunLetter,
		karanLetter,
		omarLetter,
		harpreetLetter,
		nikhilLetter,
		sameerLetter,
		devLetter,
		vikramLetter,
	};
}

async function seedFolios() {
	const priyaRelease = currentReleaseDate(household("priya").timeZone);

	await createFolio({
		household: "priya",
		releaseDate: addDays(priyaRelease, -5),
		size: 7,
		pages: [
			{
				key: "vikram",
				state: "noted",
				reasons: [
					...PRIYA_CORE("32"),
					reason("religion", "fits", { value: "hindu" }),
					reason("diet", "fits", { theirs: "veg", mine: "veg" }),
				],
			},
			{
				key: "kunal",
				state: "read",
				reasons: [
					...PRIYA_CORE("33"),
					reason("diet", "gap", { theirs: "non_veg", mine: "veg" }),
				],
			},
		],
	});
	await createFolio({
		household: "priya",
		releaseDate: addDays(priyaRelease, -3),
		size: 7,
		pages: [
			{
				key: "harpreet",
				state: "noted",
				reasons: [
					...PRIYA_CORE("30"),
					reason("religion", "fits", { value: "sikh" }),
					reason("language", "fits", { language: "Punjabi" }),
				],
			},
			{
				key: "ishaan",
				state: "read",
				reasons: [
					...PRIYA_CORE("29"),
					reason("location", "fits", { basis: "same_country", readerCity: EDISON }),
				],
			},
			{
				key: "tejas",
				state: "kept",
				reasons: [
					...PRIYA_CORE("30"),
					reason("location", "fits", { basis: "they_relocate", readerCity: EDISON }),
					reason("diet", "fits", { theirs: "veg", mine: "veg" }),
				],
			},
		],
	});

	// Today's folio (7): every reader state.
	await createFolio({
		household: "priya",
		releaseDate: priyaRelease,
		size: 7,
		pages: [
			{
				key: "rohan",
				state: "kept",
				reasons: [
					...PRIYA_CORE("31"),
					reason("religion", "fits", { value: "hindu" }),
					reason("diet", "fits", { theirs: "veg", mine: "veg" }),
					reason("language", "fits", { language: "Punjabi" }),
				],
			},
			{
				key: "aditya",
				state: "read",
				reasons: [
					...PRIYA_CORE("30"),
					reason("religion", "fits", { value: "hindu" }),
					reason("diet", "fits", { theirs: "eggetarian", mine: "veg" }),
					reason("location", "fits", { basis: "same_country", readerCity: EDISON }),
				],
			},
			{
				key: "hamza",
				state: "read",
				reasons: [
					...PRIYA_CORE("31"),
					reason("religion", "gap", { value: "muslim" }),
					reason("diet", "gap", { theirs: "halal", mine: "veg" }),
					reason("language", "fits", { language: "Hindi" }),
				],
			},
			{
				key: "manpreet",
				state: "passed",
				passReason: "distance",
				reasons: [
					...PRIYA_CORE("32"),
					reason("location", "gap", { basis: "different_country", readerCity: EDISON }),
					reason("religion", "fits", { value: "sikh" }),
					reason("language", "fits", { language: "Punjabi" }),
				],
			},
			{
				key: "dev",
				state: "noted",
				reasons: [
					...PRIYA_CORE("29"),
					reason("religion", "fits", { value: "jain" }),
					reason("diet", "fits", { theirs: "jain_veg", mine: "veg" }),
					reason("location", "fits", { basis: "same_country", readerCity: EDISON }),
				],
			},
			{
				key: "siddharth",
				state: "unread",
				reasons: [
					...PRIYA_CORE("30"),
					reason("diet", "gap", { theirs: "non_veg", mine: "veg" }),
					reason("religion", "fits", { value: "hindu" }),
					reason("language", "fits", { language: "Hindi" }),
				],
			},
			{
				key: "ishaan",
				state: "unread",
				seenBefore: true,
				reasons: [
					...PRIYA_CORE("29"),
					reason("religion", "fits", { value: "hindu" }),
					reason("diet", "fits", { theirs: "eggetarian", mine: "veg" }),
					reason("community", "unknown", { stated: "false" }),
				],
			},
		],
	});

	// Omar's folio (5, Free): three he wrote to today, Sofia unread, and Yuki, whose page has
	// since been paused ("This page has been closed by its family").
	const omarRelease = currentReleaseDate(household("omar").timeZone);
	const omarTimeline = (theirs: string) =>
		reason("timeline", "fits", {
			mine: "6_months",
			theirs,
			same: theirs === "6_months" ? "true" : "false",
		});
	await createFolio({
		household: "omar",
		releaseDate: omarRelease,
		size: 5,
		pages: [
			{
				key: "priya",
				state: "noted",
				reasons: [
					omarTimeline("1_year"),
					reason("age", "fits", { age: "29" }),
					reason("language", "fits", { language: "English" }),
				],
			},
			{
				key: "zainab",
				state: "noted",
				reasons: [
					omarTimeline("1_year"),
					reason("age", "fits", { age: "28" }),
					reason("location", "fits", {
						basis: "you_relocate",
						readerCity: "Baltimore, Maryland",
					}),
				],
			},
			{
				key: "amara",
				state: "noted",
				reasons: [omarTimeline("1_year"), reason("age", "fits", { age: "30" })],
			},
			{ key: "sofia", state: "unread", reasons: [omarTimeline("6_months")] },
			{
				key: "yuki",
				state: "read",
				reasons: [omarTimeline("2_years_plus"), reason("age", "fits", { age: "30" })],
			},
		],
	});
}

async function seedHousehold(letters: Awaited<ReturnType<typeof seedLetters>>) {
	const priya = household("priya");
	const sunita = userId("sunita");
	const kabir = userId("kabir");

	// Premium on a 7-day trial, attached to the household.
	await db.insert(purchase).values({
		organizationId: priya.organizationId,
		type: "SUBSCRIPTION",
		customerId: "cus_demo_priya",
		subscriptionId: "sub_demo_priya",
		priceId: process.env.PRICE_ID_PRO_MONTHLY ?? "price_demo_premium_monthly",
		status: "trialing",
		createdAt: ago({ days: 3 }),
	});

	// Kept pages (3).
	await db.insert(shortlist).values([
		{
			organizationId: priya.organizationId,
			userId: candidateId("priya"),
			profileUserId: candidateId("rohan"),
			keptByUserId: candidateId("priya"),
			createdAt: earlierToday(35, priya.timeZone),
		},
		{
			organizationId: priya.organizationId,
			userId: candidateId("priya"),
			profileUserId: candidateId("tejas"),
			keptByUserId: sunita,
			createdAt: ago({ days: 3 }),
		},
		{
			organizationId: priya.organizationId,
			userId: candidateId("priya"),
			profileUserId: candidateId("vikram"),
			keptByUserId: candidateId("priya"),
			createdAt: ago({ days: 5, hours: 3 }),
		},
	]);

	// Family links (3): open and reacted, expired with a note, revoked.
	const ammiCreated = ago({ days: 2 });
	const ammi = await createFamilyLink({
		household: "priya",
		createdBy: "priya",
		page: "rohan",
		recipientLabel: "Ammi",
		language: "hi",
		createdAt: ammiCreated,
		expiresAt: new Date(ammiCreated.getTime() + 7 * 24 * 60 * 60 * 1000),
		openCount: 2,
	});
	const naniCreated = ago({ days: 1, hours: 1 });
	const nani = await createFamilyLink({
		household: "priya",
		createdBy: "priya",
		page: "arjun",
		letterId: letters.arjunLetter,
		recipientLabel: "Nani",
		language: "pa",
		createdAt: naniCreated,
		expiresAt: new Date(naniCreated.getTime() + 24 * 60 * 60 * 1000),
		openCount: 1,
	});
	const masi = await createFamilyLink({
		household: "priya",
		createdBy: "sunita",
		page: "tejas",
		recipientLabel: "Masi",
		language: "hi",
		createdAt: ago({ days: 3 }),
		expiresAt: fromNow({ days: 4 }),
		revokedAt: ago({ days: 2 }),
	});

	// Pencil notes beside kept pages.
	await db.insert(marginNote).values([
		{
			organizationId: priya.organizationId,
			profileId: household("rohan").pageId,
			familyLinkId: ammi.id,
			authorLabel: "Ammi",
			reaction: "proceed",
			text: "Good family. Ask about his parents' plans to move.",
			createdAt: ago({ days: 1, hours: 20 }),
			updatedAt: ago({ days: 1, hours: 20 }),
		},
		{
			organizationId: priya.organizationId,
			profileId: household("rohan").pageId,
			authorUserId: kabir,
			authorLabel: "Bhaiya",
			reaction: "lets_talk",
			createdAt: ago({ hours: 6 }),
			updatedAt: ago({ hours: 6 }),
		},
		{
			organizationId: priya.organizationId,
			profileId: household("tejas").pageId,
			authorUserId: sunita,
			authorLabel: "Ammi",
			reaction: "not_for_us",
			text: "Too far from home",
			createdAt: ago({ days: 2, hours: 20 }),
			updatedAt: ago({ days: 2, hours: 20 }),
		},
	]);

	// Readers: Kunal read but is blocked (hidden); Aditya read incognito (no row).
	const reads: Array<[string, Date]> = [
		["arjun", ago({ days: 2 })],
		["rahul", ago({ days: 13 })],
		["karan", ago({ days: 1, hours: 6 })],
		["omar", earlierToday(60, household("omar").timeZone)],
		["harpreet", ago({ days: 4 })],
		["kunal", ago({ days: 6 })],
	];
	await db.insert(profileView).values(
		reads.map(([key, at]) => ({
			viewerUserId: candidateId(key),
			viewerOrganizationId: household(key).organizationId,
			profileUserId: candidateId("priya"),
			createdAt: at,
		})),
	);
	await db.insert(blockUser).values({
		blockerUserId: candidateId("priya"),
		blockedUserId: candidateId("kunal"),
		organizationId: priya.organizationId,
		reason: "Kept messaging my brother about me.",
		createdAt: ago({ days: 5 }),
	});

	// Wallets: Priya 10 welcome − 1 priority note = 9; Arjun spent one on his priority note too.
	for (const [key, letterId, at] of [
		["priya", letters.vikramLetter, ago({ days: 5, hours: 2 })],
		["arjun", letters.arjunLetter, ago({ days: 1, hours: 2 })],
	] as const) {
		const home = household(key);
		await db.insert(creditLedger).values({
			walletId: home.walletId,
			organizationId: home.organizationId,
			delta: -1,
			reason: "priority_note",
			interestId: letterId,
			createdByUserId: candidateId(key),
			createdAt: at,
		});
		await db
			.update(wallet)
			.set({ credits: WELCOME_CREDITS - 1, totalSpent: 1 })
			.where(eq(wallet.id, home.walletId));
	}

	// Notifications for Priya (2 unread).
	await db.insert(notification).values([
		{
			userId: candidateId("priya"),
			type: "LETTER_RECEIVED",
			data: {
				headline: "A letter is waiting for you",
				message: "A new letter is waiting.",
				letterId: letters.omarLetter,
			},
			link: `/letters/${letters.omarLetter}`,
			read: false,
			createdAt: earlierToday(40, household("omar").timeZone),
		},
		{
			userId: candidateId("priya"),
			type: "LETTER_ANSWERED",
			data: {
				headline: "Your letter has an answer",
				message: "Your letter has an answer. The seals are broken.",
				letterId: letters.harpreetLetter,
			},
			link: `/letters/${letters.harpreetLetter}`,
			read: false,
			createdAt: earlierToday(90, priya.timeZone),
		},
		{
			userId: candidateId("priya"),
			type: "CALL_PROPOSED",
			data: {
				headline: "A time has been proposed",
				message: "A time has been proposed.",
				letterId: letters.nikhilLetter,
			},
			link: `/letters/${letters.nikhilLetter}`,
			read: true,
			createdAt: ago({ days: 1, hours: 4 }),
		},
		{
			userId: candidateId("priya"),
			type: "FAMILY_REACTION",
			data: {
				headline: "A note from your family",
				message: "Ammi left a pencil note on a page.",
			},
			link: `/${priya.seed.slug}/folio/kept`,
			read: true,
			createdAt: ago({ days: 1, hours: 20 }),
		},
	]);

	// Moderation: one open report (Priya → Karan's letter), one dismissed.
	await db.insert(report).values([
		{
			reporterUserId: candidateId("priya"),
			reportedUserId: candidateId("karan"),
			reportedProfileId: household("karan").pageId,
			category: "scam_money",
			context: "letter",
			contextId: letters.karanLetter,
			details: "Asked for a loan in his first note and wants to move to WhatsApp.",
			status: "open",
			createdAt: ago({ hours: 20 }),
		},
		{
			reporterUserId: candidateId("yuki"),
			reportedUserId: candidateId("jin"),
			reportedProfileId: household("jin").pageId,
			category: "fake_profile",
			context: "page",
			contextId: household("jin").handle,
			details: "The photos look like a stock image.",
			status: "dismissed",
			moderatorNote:
				"Verified email and a consistent page history. No evidence of a fake page.",
			resolvedByUserId: userId(ADMIN.key),
			resolvedAt: ago({ days: 20 }),
			createdAt: ago({ days: 22 }),
		},
	]);

	await createTranslation("rohan", "hi", ROHAN_HINDI);
	await createTranslation("arjun", "pa", ARJUN_PUNJABI);

	return { ammi, nani, masi };
}

/** Ali's page, drafted by his mother, waits for him: a pending invitation to claim it. */
async function seedAliClaim() {
	const ali = household("ali");
	await db.insert(invitation).values({
		organizationId: ali.organizationId,
		email: demoEmail("ali"),
		role: "member",
		status: "pending",
		expiresAt: fromNow({ days: 7 }),
		inviterId: userId("nasreen"),
		createdAt: ago({ days: 2 }),
	});
}

async function main() {
	assertNotProduction();

	const password = process.env.SEED_DEMO_PASSWORD ?? generatePassword();
	const passwordHash = await hashPassword(password);

	const removed = await removeDemoData();

	for (const candidate of CANDIDATES) {
		if (candidate.claimed) {
			await createAccount(candidate.key, candidate.accountName, passwordHash);
		}
	}
	for (const helper of HELPERS) {
		await createAccount(helper.key, helper.name, passwordHash);
	}
	await createAccount(ADMIN.key, ADMIN.name, passwordHash, "admin");

	for (const candidate of CANDIDATES) {
		await createHousehold(candidate);
	}
	// Helpers join their households; Nasreen is the temporary owner of Ali's drafted page.
	await addHelpers();
	await seedAliClaim();

	const letters = await seedLetters();
	await seedFolios();
	const links = await seedHousehold(letters);

	const lines = [
		"",
		`Rishta demo seeded (removed ${removed.users} demo users and ${removed.households} households first).`,
		`Password for every demo login: ${password}${process.env.SEED_DEMO_PASSWORD ? " (from SEED_DEMO_PASSWORD)" : " (generated; set SEED_DEMO_PASSWORD to choose one)"}`,
		"",
		"Logins:",
		`  ${demoEmail("priya")}    candidate, /priya-demo (Premium, trialing)`,
		`  ${demoEmail("sunita")}   guardian "Ammi" in Priya's household`,
		`  ${demoEmail("kabir")}    family "Bhaiya" in Priya's household`,
		`  ${demoEmail("omar")}     candidate, /omar-demo (Free, daily limit reached)`,
		`  ${demoEmail("nasreen")}  drafted Ali Khan's page, /ali-demo (awaiting claim)`,
		`  ${demoEmail("admin")}    platform admin, /admin/reports`,
		"",
		"Family links (tokens are shown only now):",
		`  Ammi, Hindi, Rohan's page (open):   ${links.ammi.url}`,
		`  Nani, Punjabi, Arjun's note (expired): ${links.nani.url}`,
		`  Masi, Hindi, Tejas's page (revoked):  ${links.masi.url}`,
		"",
		`Priya's folio release date: ${currentReleaseDate(household("priya").timeZone)} (household-local).`,
	];
	console.info(lines.join("\n"));
}

main()
	.catch((error: unknown) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await db.$client.end();
	});
