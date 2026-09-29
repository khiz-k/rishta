import { createId as cuid } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import {
	boolean,
	check,
	date,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	smallint,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import {
	BIODATA_STATUSES,
	CALL_PROPOSAL_STATUSES,
	CANDIDATE_RELATIONS,
	CLOSE_REASONS,
	CLOSED_REASONS,
	DECLINE_MODES,
	DIETS,
	DRINKING_HABITS,
	EDUCATION_LEVELS,
	FAMILY_REACTIONS,
	FAMILY_TYPES,
	FAMILY_VALUES,
	FIELD_VISIBILITIES,
	FIT_KEYS,
	FOLIO_PAGE_STATES,
	GENDERS,
	INCOME_RANGES,
	INTRODUCTION_STAGES,
	INVOCATIONS,
	LEDGER_REASONS,
	LETTER_STATUSES,
	MANGLIK_VALUES,
	MARITAL_STATUSES,
	PAGE_AUTHORS,
	PAGE_LANGUAGES,
	PASS_REASONS,
	PHOTO_VISIBILITIES,
	PRACTICES,
	RELIGIONS,
	RELOCATIONS,
	REPORT_CATEGORIES,
	REPORT_CONTEXTS,
	REPORT_STATUSES,
	RESIDENCIES,
	RESIDENCY_REQUIREMENTS,
	SAFETY_CATEGORIES,
	SMOKING_HABITS,
	SUGGESTION_SOURCES,
	TIMELINES,
	VERIFICATION_LEVELS,
	type FieldVisibilityMap,
	type FitReason,
	type SafetyFlag,
	type TranslatedPage,
} from "../domain";

export const purchaseTypeEnum = pgEnum("PurchaseType", ["SUBSCRIPTION", "ONE_TIME"]);

/** Mirrors Prisma `NotificationType` (packages/database/prisma/schema.prisma). Keep both in sync. */
export const NOTIFICATION_TYPE_VALUES = [
	"WELCOME",
	"APP_UPDATE",
	"LETTER_RECEIVED",
	"LETTER_ANSWERED",
	"CALL_PROPOSED",
	"CALL_BOOKED",
	"INTRODUCTION_CLOSED",
	"FAMILY_REACTION",
	"CLAIM_REQUESTED",
	"PAGE_CLAIMED",
	"CLAIM_DECLINED",
	"FOLIO_READY",
] as const;

export const notificationTypeEnum = pgEnum("NotificationType", NOTIFICATION_TYPE_VALUES);

export const notificationTargetEnum = pgEnum("NotificationTarget", ["IN_APP", "EMAIL"]);

export const user = pgTable("user", {
	id: text("id")
		.$defaultFn(() => cuid())
		.primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
	username: text("username").unique(),
	displayUsername: text("displayUsername"),
	role: text("role"),
	banned: boolean("banned").default(false),
	banReason: text("banReason"),
	banExpires: timestamp("banExpires"),
	twoFactorEnabled: boolean("twoFactorEnabled").default(false),
	onboardingComplete: boolean("onboardingComplete"),
	paymentsCustomerId: text("paymentsCustomerId"),
	locale: text("locale"),
	lastActiveOrganizationId: text("lastActiveOrganizationId"),
});

export const session = pgTable(
	"session",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		expiresAt: timestamp("expiresAt").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text("ipAddress"),
		userAgent: text("userAgent"),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		impersonatedBy: text("impersonatedBy"),
		activeOrganizationId: text("activeOrganizationId"),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
	"account",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		accountId: text("accountId").notNull(),
		providerId: text("providerId").notNull(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("accessToken"),
		refreshToken: text("refreshToken"),
		idToken: text("idToken"),
		accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
		refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
	"verification",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expiresAt").notNull(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const passkey = pgTable(
	"passkey",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		name: text("name"),
		publicKey: text("publicKey").notNull(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		credentialID: text("credentialID").notNull(),
		counter: integer("counter").notNull(),
		deviceType: text("deviceType").notNull(),
		backedUp: boolean("backedUp").notNull(),
		transports: text("transports"),
		createdAt: timestamp("createdAt"),
		aaguid: text("aaguid"),
	},
	(table) => [
		index("passkey_userId_idx").on(table.userId),
		index("passkey_credentialID_idx").on(table.credentialID),
	],
);

export const organization = pgTable(
	"organization",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),
		logo: text("logo"),
		createdAt: timestamp("createdAt").notNull(),
		metadata: text("metadata"),
		paymentsCustomerId: text("paymentsCustomerId"),
	},
	(table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);

export const member = pgTable(
	"member",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: text("role").default("member").notNull(),
		createdAt: timestamp("createdAt").notNull(),
	},
	(table) => [
		index("member_organizationId_idx").on(table.organizationId),
		index("member_userId_idx").on(table.userId),
	],
);

export const invitation = pgTable(
	"invitation",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		email: text("email").notNull(),
		role: text("role"),
		status: text("status").default("pending").notNull(),
		expiresAt: timestamp("expiresAt").notNull(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		inviterId: text("inviterId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("invitation_organizationId_idx").on(table.organizationId),
		index("invitation_email_idx").on(table.email),
	],
);

export const twoFactor = pgTable(
	"twoFactor",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		secret: text("secret").notNull(),
		backupCodes: text("backupCodes").notNull(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("twoFactor_secret_idx").on(table.secret),
		index("twoFactor_userId_idx").on(table.userId),
	],
);

export const purchase = pgTable("purchase", {
	id: text("id")
		.$defaultFn(() => cuid())
		.primaryKey(),
	organizationId: text("organizationId").references(() => organization.id, {
		onDelete: "cascade",
	}),
	userId: text("userId").references(() => user.id, {
		onDelete: "cascade",
	}),
	type: purchaseTypeEnum("type").notNull(),
	customerId: text("customerId").notNull(),
	subscriptionId: text("subscriptionId").unique(),
	priceId: text("priceId").notNull(),
	status: text("status"),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt"),
});

export const notification = pgTable(
	"notification",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: notificationTypeEnum("type").notNull(),
		data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
		link: text("link"),
		read: boolean("read").notNull().default(false),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("notification_userId_idx").on(table.userId)],
);

export const userNotificationPreference = pgTable(
	"user_notification_preference",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: notificationTypeEnum("type").notNull(),
		target: notificationTargetEnum("target").notNull(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => [
		index("user_notification_preference_userId_idx").on(table.userId),
		uniqueIndex("user_notification_preference_user_type_target_uidx").on(
			table.userId,
			table.type,
			table.target,
		),
	],
);

export const userRelations = relations(user, ({ one, many }) => ({
	sessions: many(session),
	accounts: many(account),
	passkeys: many(passkey),
	members: many(member),
	invitations: many(invitation),
	twoFactors: many(twoFactor),
	purchases: many(purchase),
	notifications: many(notification),
	notificationPreferences: many(userNotificationPreference),
	biodataProfile: one(biodataProfile),
	sentInterests: many(interest, { relationName: "sentInterests" }),
	receivedInterests: many(interest, { relationName: "receivedInterests" }),
	sentMessages: many(message, { relationName: "sentMessages" }),
	receivedMessages: many(message, { relationName: "receivedMessages" }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const passkeyRelations = relations(passkey, ({ one }) => ({
	user: one(user, {
		fields: [passkey.userId],
		references: [user.id],
	}),
}));

export const organizationRelations = relations(organization, ({ one, many }) => ({
	members: many(member),
	invitations: many(invitation),
	purchases: many(purchase),
	biodataProfile: one(biodataProfile),
	partnerPreference: one(partnerPreference),
	householdSetting: one(householdSetting),
	wallet: one(wallet),
	folios: many(folio),
	familyLinks: many(familyLink),
	marginNotes: many(marginNote),
}));

export const memberRelations = relations(member, ({ one }) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id],
	}),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [invitation.inviterId],
		references: [user.id],
	}),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
	user: one(user, {
		fields: [twoFactor.userId],
		references: [user.id],
	}),
}));

export const purchaseRelations = relations(purchase, ({ one }) => ({
	organization: one(organization, {
		fields: [purchase.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [purchase.userId],
		references: [user.id],
	}),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
	user: one(user, {
		fields: [notification.userId],
		references: [user.id],
	}),
}));

export const userNotificationPreferenceRelations = relations(
	userNotificationPreference,
	({ one }) => ({
		user: one(user, {
			fields: [userNotificationPreference.userId],
			references: [user.id],
		}),
	}),
);

// ===== Rishta Domain Enums (spec.md §6.1) =====

export const biodataStatusEnum = pgEnum("BiodataStatus", BIODATA_STATUSES);
export const genderEnum = pgEnum("Gender", GENDERS);
export const maritalStatusEnum = pgEnum("MaritalStatus", MARITAL_STATUSES);
export const religionEnum = pgEnum("Religion", RELIGIONS);
export const practiceEnum = pgEnum("Practice", PRACTICES);
export const educationLevelEnum = pgEnum("EducationLevel", EDUCATION_LEVELS);
export const incomeRangeEnum = pgEnum("IncomeRange", INCOME_RANGES);
export const familyTypeEnum = pgEnum("FamilyType", FAMILY_TYPES);
export const familyValuesEnum = pgEnum("FamilyValues", FAMILY_VALUES);
export const dietEnum = pgEnum("Diet", DIETS);
export const smokingEnum = pgEnum("Smoking", SMOKING_HABITS);
export const drinkingEnum = pgEnum("Drinking", DRINKING_HABITS);
export const pageAuthorEnum = pgEnum("PageAuthor", PAGE_AUTHORS);
export const candidateRelationEnum = pgEnum("CandidateRelation", CANDIDATE_RELATIONS);
export const residencyEnum = pgEnum("Residency", RESIDENCIES);
export const manglikEnum = pgEnum("Manglik", MANGLIK_VALUES);
export const invocationEnum = pgEnum("Invocation", INVOCATIONS);
export const pageLanguageEnum = pgEnum("PageLanguage", PAGE_LANGUAGES);
export const fieldVisibilityEnum = pgEnum("FieldVisibility", FIELD_VISIBILITIES);
export const photoVisibilityEnum = pgEnum("PhotoVisibility", PHOTO_VISIBILITIES);
// Named VerificationLevel so it never reads like the Better Auth `verification` table.
export const verificationLevelEnum = pgEnum("VerificationLevel", VERIFICATION_LEVELS);
export const timelineEnum = pgEnum("Timeline", TIMELINES);
export const relocationEnum = pgEnum("Relocation", RELOCATIONS);
export const residencyRequirementEnum = pgEnum("ResidencyRequirement", RESIDENCY_REQUIREMENTS);
export const fitKeyEnum = pgEnum("FitKey", FIT_KEYS);
export const folioPageStateEnum = pgEnum("FolioPageState", FOLIO_PAGE_STATES);
export const passReasonEnum = pgEnum("PassReason", PASS_REASONS);
export const letterStatusEnum = pgEnum("LetterStatus", LETTER_STATUSES);
export const declineModeEnum = pgEnum("DeclineMode", DECLINE_MODES);
export const introductionStageEnum = pgEnum("IntroductionStage", INTRODUCTION_STAGES);
export const closeReasonEnum = pgEnum("CloseReason", CLOSE_REASONS);
export const callProposalStatusEnum = pgEnum("CallProposalStatus", CALL_PROPOSAL_STATUSES);
export const familyReactionEnum = pgEnum("FamilyReaction", FAMILY_REACTIONS);
export const reportCategoryEnum = pgEnum("ReportCategory", REPORT_CATEGORIES);
export const reportContextEnum = pgEnum("ReportContext", REPORT_CONTEXTS);
export const reportStatusEnum = pgEnum("ReportStatus", REPORT_STATUSES);
export const ledgerReasonEnum = pgEnum("LedgerReason", LEDGER_REASONS);
export const closedReasonEnum = pgEnum("ClosedReason", CLOSED_REASONS);
export const safetyCategoryEnum = pgEnum("SafetyCategory", SAFETY_CATEGORIES);
export const suggestionSourceEnum = pgEnum("SuggestionSource", SUGGESTION_SOURCES);

const emptyArray = sql`'{}'`;

// ===== Rishta Domain Tables (spec.md §6) =====

/**
 * The page: one candidate's biodata. One page per household (organization).
 * gender, dateOfBirth and religion are nullable because households.create makes a draft page
 * before they are known; profiles.publish enforces them (the "required four").
 */
export const biodataProfile = pgTable(
	"biodata_profile",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		organizationId: text("organizationId")
			.notNull()
			.unique()
			.references(() => organization.id, { onDelete: "cascade" }),
		// The candidate. Null until a page drafted by a relative is claimed.
		userId: text("userId")
			.unique()
			.references(() => user.id, { onDelete: "cascade" }),
		handle: text("handle").notNull().unique(),
		status: biodataStatusEnum("status").notNull().default("draft"),
		// Legacy mirror of status = active; dropped after the migration.
		isActive: boolean("isActive").default(false).notNull(),
		displayName: text("displayName").notNull(),
		fullName: text("fullName"),
		gender: genderEnum("gender"),
		dateOfBirth: text("dateOfBirth"), // YYYY-MM-DD
		height: integer("height"), // cm
		religion: religionEnum("religion"),
		sect: text("sect"),
		practice: practiceEnum("practice"),
		community: text("community"),
		motherTongue: text("motherTongue"),
		languages: text("languages").array().notNull().default(emptyArray),
		maritalStatus: maritalStatusEnum("maritalStatus").notNull().default("never_married"),
		hasChildren: boolean("hasChildren"),
		education: educationLevelEnum("education"),
		university: text("university"),
		profession: text("profession"),
		employer: text("employer"),
		incomeRange: incomeRangeEnum("incomeRange"),
		familyType: familyTypeEnum("familyType"),
		familyValues: familyValuesEnum("familyValues"),
		fatherOccupation: text("fatherOccupation"),
		motherOccupation: text("motherOccupation"),
		siblings: text("siblings"),
		nativePlace: text("nativePlace"),
		aboutFamily: text("aboutFamily"),
		diet: dietEnum("diet").notNull().default("non_veg"),
		smoking: smokingEnum("smoking").notNull().default("never"),
		drinking: drinkingEnum("drinking").notNull().default("never"),
		aboutMe: text("aboutMe"),
		lookingFor: text("lookingFor"),
		createdBy: pageAuthorEnum("createdBy").notNull().default("self"),
		location: text("location"), // "Edison, New Jersey"
		country: text("country"), // ISO 3166-1 alpha-2
		timeZone: text("timeZone").notNull().default("America/New_York"), // IANA
		residency: residencyEnum("residency"),
		birthTime: text("birthTime"), // HH:MM
		birthPlace: text("birthPlace"),
		manglik: manglikEnum("manglik"),
		invocation: invocationEnum("invocation").notNull().default("none"),
		invocationText: text("invocationText"),
		pageLanguage: pageLanguageEnum("pageLanguage").notNull().default("en"),
		fieldVisibility: jsonb("fieldVisibility").$type<FieldVisibilityMap>().notNull().default({}),
		verification: verificationLevelEnum("verification").notNull().default("none"),
		// Legacy mirror of verification != none.
		isVerified: boolean("isVerified").default(false).notNull(),
		contactPhone: text("contactPhone"), // E.164
		familyContactName: text("familyContactName"),
		familyContactPhone: text("familyContactPhone"),
		// Legacy public photo URL: migrated to biodata_photo, then dropped.
		profilePhoto: text("profilePhoto"),
		claimedAt: timestamp("claimedAt"),
		publishedAt: timestamp("publishedAt"),
		pausedAt: timestamp("pausedAt"),
		closedAt: timestamp("closedAt"),
		closedReason: closedReasonEnum("closedReason"),
		closingStory: text("closingStory"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("biodata_profile_userId_idx").on(table.userId),
		index("biodata_profile_organizationId_idx").on(table.organizationId),
		index("biodata_profile_status_idx").on(table.status),
		index("biodata_profile_gender_idx").on(table.gender),
		index("biodata_profile_religion_idx").on(table.religion),
		uniqueIndex("biodata_profile_handle_uidx").on(table.handle),
	],
);

export const biodataPhoto = pgTable(
	"biodata_photo",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		profileId: text("profileId")
			.notNull()
			.references(() => biodataProfile.id, { onDelete: "cascade" }),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		// Private bucket `biodata-photos`; seed rows use an `external:` prefix.
		storageKey: text("storageKey").notNull(),
		veilKey: text("veilKey").notNull(),
		width: integer("width").notNull(),
		height: integer("height").notNull(),
		position: smallint("position").notNull().default(0),
		visibility: photoVisibilityEnum("visibility").notNull().default("after_yes"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => [
		index("biodata_photo_profileId_idx").on(table.profileId),
		// Positions 0-4 (validated by the API); 0 is the primary photo.
		uniqueIndex("biodata_photo_profile_position_uidx").on(table.profileId, table.position),
	],
);

/** "Looking for": the household's non-negotiables. */
export const partnerPreference = pgTable(
	"partner_preference",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		organizationId: text("organizationId")
			.notNull()
			.unique()
			.references(() => organization.id, { onDelete: "cascade" }),
		// Legacy candidate link.
		userId: text("userId")
			.unique()
			.references(() => user.id, { onDelete: "cascade" }),
		seeking: genderEnum("seeking").notNull(),
		marriageTimeline: timelineEnum("marriageTimeline"),
		relocation: relocationEnum("relocation"),
		residencyRequirement: residencyRequirementEnum("residencyRequirement"),
		// Legacy mirrors of relocation / residencyRequirement.
		willingToRelocate: boolean("willingToRelocate"),
		requiresCitizenship: boolean("requiresCitizenship"),
		valuesLooks: integer("valuesLooks"),
		valuesPersonality: integer("valuesPersonality"),
		valuesFinancial: integer("valuesFinancial"),
		ageMin: integer("ageMin"),
		ageMax: integer("ageMax"),
		heightMin: integer("heightMin"),
		heightMax: integer("heightMax"),
		religions: religionEnum("religions").array().notNull().default(emptyArray),
		communities: text("communities").array().notNull().default(emptyArray),
		educationLevels: educationLevelEnum("educationLevels")
			.array()
			.notNull()
			.default(emptyArray),
		professions: text("professions").array().notNull().default(emptyArray),
		locations: text("locations").array().notNull().default(emptyArray),
		countries: text("countries").array().notNull().default(emptyArray),
		diet: dietEnum("diet").array().notNull().default(emptyArray),
		maritalStatus: maritalStatusEnum("maritalStatus").array().notNull().default(emptyArray),
		languages: text("languages").array().notNull().default(emptyArray),
		dealbreakers: fitKeyEnum("dealbreakers")
			.array()
			.notNull()
			.default(sql`'{timeline}'`),
		// Legacy mirror of completedAt.
		quizComplete: boolean("quizComplete").default(false).notNull(),
		completedAt: timestamp("completedAt"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("partner_preference_organizationId_idx").on(table.organizationId),
		check(
			"partner_preference_values_budget_check",
			sql`COALESCE(${table.valuesLooks}, 0) + COALESCE(${table.valuesPersonality}, 0) + COALESCE(${table.valuesFinancial}, 0) <= 12`,
		),
	],
);

export const householdSetting = pgTable("household_setting", {
	organizationId: text("organizationId")
		.primaryKey()
		.references(() => organization.id, { onDelete: "cascade" }),
	candidateRelation: candidateRelationEnum("candidateRelation").notNull(),
	pendingCandidateEmail: text("pendingCandidateEmail"),
	familyReadsFolio: boolean("familyReadsFolio").notNull().default(true),
	familyEditsPage: boolean("familyEditsPage").notNull().default(false),
	familySeesIntroductions: boolean("familySeesIntroductions").notNull().default(false),
	familyLinksAllowed: boolean("familyLinksAllowed").notNull().default(true),
	familyLanguage: pageLanguageEnum("familyLanguage").notNull().default("hi"),
	readIncognito: boolean("readIncognito").notNull().default(false),
	discreetEmails: boolean("discreetEmails").notNull().default(true),
	keyboardShortcuts: boolean("keyboardShortcuts").notNull().default(true),
	folioReleaseHour: smallint("folioReleaseHour").notNull().default(19),
	// Relation labels by userId ("Ammi", "Bhaiya"); pencil notes are signed with them (F11).
	memberLabels: jsonb("memberLabels").$type<Record<string, string>>().notNull().default({}),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const folio = pgTable(
	"folio",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		releaseDate: date("releaseDate", { mode: "string" }).notNull(), // household-local YYYY-MM-DD
		size: smallint("size").notNull(),
		generatedAt: timestamp("generatedAt").defaultNow().notNull(),
	},
	(table) => [uniqueIndex("folio_org_release_uidx").on(table.organizationId, table.releaseDate)],
);

export const folioPage = pgTable(
	"folio_page",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		folioId: text("folioId")
			.notNull()
			.references(() => folio.id, { onDelete: "cascade" }),
		// The reader household.
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		// The page shown.
		profileId: text("profileId")
			.notNull()
			.references(() => biodataProfile.id, { onDelete: "cascade" }),
		position: smallint("position").notNull(),
		reasons: jsonb("reasons").$type<FitReason[]>().notNull().default([]),
		// Internal ordering only. Never selected into API output.
		score: integer("score").notNull().default(0),
		state: folioPageStateEnum("state").notNull().default("unread"),
		passReason: passReasonEnum("passReason"),
		seenBefore: boolean("seenBefore").notNull().default(false),
		answeredAt: timestamp("answeredAt"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("folio_page_folio_profile_uidx").on(table.folioId, table.profileId),
		index("folio_page_org_profile_idx").on(table.organizationId, table.profileId),
		index("folio_page_profile_created_idx").on(table.profileId, table.createdAt),
	],
);

/** A first-line suggestion, stored so the server can refuse it verbatim (F6, §9b). */
export const noteSuggestion = pgTable(
	"note_suggestion",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		toProfileId: text("toProfileId")
			.notNull()
			.references(() => biodataProfile.id, { onDelete: "cascade" }),
		line: text("line").notNull(),
		basedOn: fitKeyEnum("basedOn").array().notNull().default(emptyArray),
		source: suggestionSourceEnum("source").notNull(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => [
		index("note_suggestion_org_profile_idx").on(table.organizationId, table.toProfileId),
	],
);

/** A letter: the sealed note and everything after it. The id is the letter id in URLs. */
export const interest = pgTable(
	"interest",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		fromUserId: text("fromUserId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		toUserId: text("toUserId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		fromOrganizationId: text("fromOrganizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		toOrganizationId: text("toOrganizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		status: letterStatusEnum("status").notNull().default("pending"),
		// The note: 40-400 characters for new letters; old rows are grandfathered.
		message: text("message"),
		isPriority: boolean("isPriority").notNull().default(false),
		priorityUntil: timestamp("priorityUntil"),
		creditsSpent: integer("creditsSpent").notNull().default(0),
		// Deprecated: never read or written again; dropped after the migration.
		bidAmount: integer("bidAmount").default(0).notNull(),
		suggestionId: text("suggestionId").references(() => noteSuggestion.id, {
			onDelete: "set null",
		}),
		safetyFlag: jsonb("safetyFlag").$type<SafetyFlag>(),
		declineMode: declineModeEnum("declineMode"),
		declineNote: text("declineNote"),
		respondedAt: timestamp("respondedAt"),
		closedAt: timestamp("closedAt"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("interest_fromUserId_idx").on(table.fromUserId),
		index("interest_toUserId_idx").on(table.toUserId),
		index("interest_fromOrganizationId_idx").on(table.fromOrganizationId, table.createdAt),
		index("interest_toOrganizationId_idx").on(table.toOrganizationId, table.status),
		uniqueIndex("interest_from_to_uidx").on(table.fromUserId, table.toUserId),
	],
);

/** An introduction: what a yes creates at once. */
export const match = pgTable(
	"match",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		interestId: text("interestId")
			.notNull()
			.unique()
			.references(() => interest.id, { onDelete: "cascade" }),
		// The sorted `userAId:userBId`, so a pair can never have a second match.
		pairKey: text("pairKey").notNull().unique(),
		// A is the sender of the letter, B the acceptor.
		userAId: text("userAId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		organizationAId: text("organizationAId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		userBId: text("userBId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		organizationBId: text("organizationBId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		stage: introductionStageEnum("stage").notNull().default("introduced"),
		sealsSeenByAAt: timestamp("sealsSeenByAAt"),
		sealsSeenByBAt: timestamp("sealsSeenByBAt"),
		phoneSharedByA: boolean("phoneSharedByA").notNull().default(false),
		phoneSharedByB: boolean("phoneSharedByB").notNull().default(false),
		familySharedByA: boolean("familySharedByA").notNull().default(false),
		familySharedByB: boolean("familySharedByB").notNull().default(false),
		lastMessageAt: timestamp("lastMessageAt"),
		closedAt: timestamp("closedAt"),
		closedByUserId: text("closedByUserId").references(() => user.id, { onDelete: "set null" }),
		closingNote: text("closingNote"),
		closeReason: closeReasonEnum("closeReason"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("match_userAId_idx").on(table.userAId),
		index("match_userBId_idx").on(table.userBId),
		index("match_organizationAId_idx").on(table.organizationAId),
		index("match_organizationBId_idx").on(table.organizationBId),
	],
);

export const callProposal = pgTable(
	"call_proposal",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		matchId: text("matchId")
			.notNull()
			.references(() => match.id, { onDelete: "cascade" }),
		// Null means proposed by Rishta (the introduction's three evenings).
		proposedByUserId: text("proposedByUserId").references(() => user.id, {
			onDelete: "set null",
		}),
		slots: timestamp("slots", { withTimezone: true, mode: "date" }).array().notNull(),
		timeZoneA: text("timeZoneA").notNull(),
		timeZoneB: text("timeZoneB").notNull(),
		availabilityA: smallint("availabilityA").array().notNull().default(emptyArray),
		availabilityB: smallint("availabilityB").array().notNull().default(emptyArray),
		status: callProposalStatusEnum("status").notNull().default("open"),
		bookedSlot: timestamp("bookedSlot", { withTimezone: true, mode: "date" }),
		note: text("note"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		answeredAt: timestamp("answeredAt"),
	},
	(table) => [index("call_proposal_matchId_idx").on(table.matchId, table.createdAt)],
);

/** Kept pages. */
export const shortlist = pgTable(
	"shortlist",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		// The reader household.
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		// Legacy: the household's candidate.
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		// The candidate whose page was kept.
		profileUserId: text("profileUserId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		// The candidate or a family member ("Kept by Ammi").
		keptByUserId: text("keptByUserId").references(() => user.id, { onDelete: "set null" }),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => [
		index("shortlist_userId_idx").on(table.userId),
		uniqueIndex("shortlist_org_profile_uidx").on(table.organizationId, table.profileUserId),
	],
);

/** The household wallet. */
export const wallet = pgTable(
	"wallet",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		organizationId: text("organizationId")
			.notNull()
			.unique()
			.references(() => organization.id, { onDelete: "cascade" }),
		// Legacy per-user wallet link.
		userId: text("userId").references(() => user.id, { onDelete: "set null" }),
		credits: integer("credits").notNull().default(10),
		totalSpent: integer("totalSpent").notNull().default(0),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("wallet_userId_idx").on(table.userId),
		check("wallet_credits_nonnegative_check", sql`${table.credits} >= 0`),
	],
);

export const creditLedger = pgTable(
	"credit_ledger",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		walletId: text("walletId")
			.notNull()
			.references(() => wallet.id, { onDelete: "cascade" }),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		delta: integer("delta").notNull(),
		reason: ledgerReasonEnum("reason").notNull(),
		interestId: text("interestId").references(() => interest.id, { onDelete: "set null" }),
		// Unique: the Stripe webhook grants a pack at most once.
		purchaseId: text("purchaseId")
			.unique()
			.references(() => purchase.id, { onDelete: "set null" }),
		createdByUserId: text("createdByUserId").references(() => user.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => [index("credit_ledger_wallet_idx").on(table.walletId, table.createdAt)],
);

/** Readers: who read a page. No row is written for incognito readers. */
export const profileView = pgTable(
	"profile_view",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		viewerUserId: text("viewerUserId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		viewerOrganizationId: text("viewerOrganizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		profileUserId: text("profileUserId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => [
		index("profile_view_viewer_idx").on(table.viewerUserId),
		index("profile_view_profile_idx").on(table.profileUserId, table.createdAt),
		uniqueIndex("profile_view_unique_idx").on(table.viewerUserId, table.profileUserId),
	],
);

export const blockUser = pgTable(
	"block_user",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		blockerUserId: text("blockerUserId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		blockedUserId: text("blockedUserId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		// The blocker's household.
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		reason: text("reason"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => [
		index("block_user_blocker_idx").on(table.blockerUserId),
		index("block_user_blocked_idx").on(table.blockedUserId),
		uniqueIndex("block_user_unique_idx").on(table.blockerUserId, table.blockedUserId),
	],
);

/** Correspondence inside an introduction. */
export const message = pgTable(
	"message",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		matchId: text("matchId")
			.notNull()
			.references(() => match.id, { onDelete: "cascade" }),
		fromUserId: text("fromUserId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		toUserId: text("toUserId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		content: text("content").notNull(),
		read: boolean("read").default(false).notNull(),
		safetyFlag: jsonb("safetyFlag").$type<SafetyFlag>(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => [
		index("message_fromUserId_idx").on(table.fromUserId),
		index("message_toUserId_idx").on(table.toUserId, table.read),
		index("message_match_created_idx").on(table.matchId, table.createdAt),
	],
);

/** A private, watermarked, expiring page link for family without an account. */
export const familyLink = pgTable(
	"family_link",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		// The sharing household.
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		createdByUserId: text("createdByUserId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		// The page shared.
		profileId: text("profileId")
			.notNull()
			.references(() => biodataProfile.id, { onDelete: "cascade" }),
		// Set when "Include his note" was ticked on a received letter.
		letterId: text("letterId").references(() => interest.id, { onDelete: "set null" }),
		// SHA-256 hex of the 32-byte token; the token itself is never stored.
		tokenHash: text("tokenHash").notNull().unique(),
		recipientLabel: text("recipientLabel").notNull(),
		language: pageLanguageEnum("language").notNull(),
		expiresAt: timestamp("expiresAt").notNull(),
		revokedAt: timestamp("revokedAt"),
		firstOpenedAt: timestamp("firstOpenedAt"),
		lastOpenedAt: timestamp("lastOpenedAt"),
		openCount: integer("openCount").notNull().default(0),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => [
		index("family_link_org_idx").on(table.organizationId, table.createdAt),
		index("family_link_profile_idx").on(table.profileId),
	],
);

/** Pencil notes: family or household reactions in a page's margin. */
export const marginNote = pgTable(
	"margin_note",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		// The household whose margin it is.
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		// The page it sits beside.
		profileId: text("profileId")
			.notNull()
			.references(() => biodataProfile.id, { onDelete: "cascade" }),
		authorUserId: text("authorUserId").references(() => user.id, { onDelete: "cascade" }),
		familyLinkId: text("familyLinkId").references(() => familyLink.id, { onDelete: "cascade" }),
		authorLabel: text("authorLabel").notNull(),
		reaction: familyReactionEnum("reaction"),
		text: text("text"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("margin_note_org_profile_idx").on(table.organizationId, table.profileId),
		uniqueIndex("margin_note_link_profile_uidx").on(table.familyLinkId, table.profileId),
		check(
			"margin_note_reaction_or_text_check",
			sql`${table.reaction} IS NOT NULL OR ${table.text} IS NOT NULL`,
		),
	],
);

export const report = pgTable(
	"report",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		// Null when filed from a family link. The reporter is never revealed.
		reporterUserId: text("reporterUserId").references(() => user.id, { onDelete: "set null" }),
		reporterFamilyLinkId: text("reporterFamilyLinkId").references(() => familyLink.id, {
			onDelete: "set null",
		}),
		reportedUserId: text("reportedUserId").references(() => user.id, { onDelete: "set null" }),
		reportedProfileId: text("reportedProfileId").references(() => biodataProfile.id, {
			onDelete: "set null",
		}),
		category: reportCategoryEnum("category").notNull(),
		context: reportContextEnum("context").notNull(),
		contextId: text("contextId").notNull(),
		details: text("details"),
		status: reportStatusEnum("status").notNull().default("open"),
		moderatorNote: text("moderatorNote"),
		resolvedByUserId: text("resolvedByUserId").references(() => user.id, {
			onDelete: "set null",
		}),
		resolvedAt: timestamp("resolvedAt"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => [
		index("report_status_idx").on(table.status, table.createdAt),
		index("report_reportedUserId_idx").on(table.reportedUserId),
	],
);

export const biodataTranslation = pgTable(
	"biodata_translation",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		profileId: text("profileId")
			.notNull()
			.references(() => biodataProfile.id, { onDelete: "cascade" }),
		language: pageLanguageEnum("language").notNull(),
		sourceUpdatedAt: timestamp("sourceUpdatedAt").notNull(),
		content: jsonb("content").$type<TranslatedPage>().notNull(),
		model: text("model").notNull(),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("biodata_translation_profile_language_source_uidx").on(
			table.profileId,
			table.language,
			table.sourceUpdatedAt,
		),
	],
);

// ===== Rishta Relations (spec.md §6.21) =====

export const biodataProfileRelations = relations(biodataProfile, ({ one, many }) => ({
	organization: one(organization, {
		fields: [biodataProfile.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [biodataProfile.userId],
		references: [user.id],
	}),
	photos: many(biodataPhoto),
	folioPages: many(folioPage),
	translations: many(biodataTranslation),
}));

export const biodataPhotoRelations = relations(biodataPhoto, ({ one }) => ({
	profile: one(biodataProfile, {
		fields: [biodataPhoto.profileId],
		references: [biodataProfile.id],
	}),
	organization: one(organization, {
		fields: [biodataPhoto.organizationId],
		references: [organization.id],
	}),
}));

export const partnerPreferenceRelations = relations(partnerPreference, ({ one }) => ({
	organization: one(organization, {
		fields: [partnerPreference.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [partnerPreference.userId],
		references: [user.id],
	}),
}));

export const householdSettingRelations = relations(householdSetting, ({ one }) => ({
	organization: one(organization, {
		fields: [householdSetting.organizationId],
		references: [organization.id],
	}),
}));

export const folioRelations = relations(folio, ({ one, many }) => ({
	organization: one(organization, {
		fields: [folio.organizationId],
		references: [organization.id],
	}),
	pages: many(folioPage),
}));

export const folioPageRelations = relations(folioPage, ({ one }) => ({
	folio: one(folio, {
		fields: [folioPage.folioId],
		references: [folio.id],
	}),
	profile: one(biodataProfile, {
		fields: [folioPage.profileId],
		references: [biodataProfile.id],
	}),
}));

export const noteSuggestionRelations = relations(noteSuggestion, ({ one }) => ({
	organization: one(organization, {
		fields: [noteSuggestion.organizationId],
		references: [organization.id],
	}),
	toProfile: one(biodataProfile, {
		fields: [noteSuggestion.toProfileId],
		references: [biodataProfile.id],
	}),
}));

export const interestRelations = relations(interest, ({ one }) => ({
	fromUser: one(user, {
		fields: [interest.fromUserId],
		references: [user.id],
		relationName: "sentInterests",
	}),
	toUser: one(user, {
		fields: [interest.toUserId],
		references: [user.id],
		relationName: "receivedInterests",
	}),
	fromOrganization: one(organization, {
		fields: [interest.fromOrganizationId],
		references: [organization.id],
	}),
	toOrganization: one(organization, {
		fields: [interest.toOrganizationId],
		references: [organization.id],
	}),
	suggestion: one(noteSuggestion, {
		fields: [interest.suggestionId],
		references: [noteSuggestion.id],
	}),
	match: one(match),
}));

export const matchRelations = relations(match, ({ one, many }) => ({
	interest: one(interest, {
		fields: [match.interestId],
		references: [interest.id],
	}),
	userA: one(user, {
		fields: [match.userAId],
		references: [user.id],
	}),
	userB: one(user, {
		fields: [match.userBId],
		references: [user.id],
	}),
	proposals: many(callProposal),
	messages: many(message),
}));

export const callProposalRelations = relations(callProposal, ({ one }) => ({
	match: one(match, {
		fields: [callProposal.matchId],
		references: [match.id],
	}),
}));

export const shortlistRelations = relations(shortlist, ({ one }) => ({
	organization: one(organization, {
		fields: [shortlist.organizationId],
		references: [organization.id],
	}),
	profileUser: one(user, {
		fields: [shortlist.profileUserId],
		references: [user.id],
	}),
}));

export const walletRelations = relations(wallet, ({ one, many }) => ({
	organization: one(organization, {
		fields: [wallet.organizationId],
		references: [organization.id],
	}),
	ledger: many(creditLedger),
}));

export const creditLedgerRelations = relations(creditLedger, ({ one }) => ({
	wallet: one(wallet, {
		fields: [creditLedger.walletId],
		references: [wallet.id],
	}),
}));

export const messageRelations = relations(message, ({ one }) => ({
	match: one(match, {
		fields: [message.matchId],
		references: [match.id],
	}),
	fromUser: one(user, {
		fields: [message.fromUserId],
		references: [user.id],
		relationName: "sentMessages",
	}),
	toUser: one(user, {
		fields: [message.toUserId],
		references: [user.id],
		relationName: "receivedMessages",
	}),
}));

export const familyLinkRelations = relations(familyLink, ({ one }) => ({
	organization: one(organization, {
		fields: [familyLink.organizationId],
		references: [organization.id],
	}),
	profile: one(biodataProfile, {
		fields: [familyLink.profileId],
		references: [biodataProfile.id],
	}),
	letter: one(interest, {
		fields: [familyLink.letterId],
		references: [interest.id],
	}),
}));

export const marginNoteRelations = relations(marginNote, ({ one }) => ({
	organization: one(organization, {
		fields: [marginNote.organizationId],
		references: [organization.id],
	}),
	profile: one(biodataProfile, {
		fields: [marginNote.profileId],
		references: [biodataProfile.id],
	}),
	familyLink: one(familyLink, {
		fields: [marginNote.familyLinkId],
		references: [familyLink.id],
	}),
}));

export const reportRelations = relations(report, ({ one }) => ({
	reportedProfile: one(biodataProfile, {
		fields: [report.reportedProfileId],
		references: [biodataProfile.id],
	}),
}));

export const biodataTranslationRelations = relations(biodataTranslation, ({ one }) => ({
	profile: one(biodataProfile, {
		fields: [biodataTranslation.profileId],
		references: [biodataProfile.id],
	}),
}));

// ===== Rishta row types =====

export type BiodataProfileRow = typeof biodataProfile.$inferSelect;
export type BiodataProfileInsert = typeof biodataProfile.$inferInsert;
export type BiodataPhotoRow = typeof biodataPhoto.$inferSelect;
export type PartnerPreferenceRow = typeof partnerPreference.$inferSelect;
export type PartnerPreferenceInsert = typeof partnerPreference.$inferInsert;
export type HouseholdSettingRow = typeof householdSetting.$inferSelect;
export type FolioRow = typeof folio.$inferSelect;
export type FolioPageRow = typeof folioPage.$inferSelect;
export type NoteSuggestionRow = typeof noteSuggestion.$inferSelect;
export type InterestRow = typeof interest.$inferSelect;
export type MatchRow = typeof match.$inferSelect;
export type CallProposalRow = typeof callProposal.$inferSelect;
export type ShortlistRow = typeof shortlist.$inferSelect;
export type WalletRow = typeof wallet.$inferSelect;
export type CreditLedgerRow = typeof creditLedger.$inferSelect;
export type ProfileViewRow = typeof profileView.$inferSelect;
export type BlockUserRow = typeof blockUser.$inferSelect;
export type MessageRow = typeof message.$inferSelect;
export type FamilyLinkRow = typeof familyLink.$inferSelect;
export type MarginNoteRow = typeof marginNote.$inferSelect;
export type ReportRow = typeof report.$inferSelect;
export type BiodataTranslationRow = typeof biodataTranslation.$inferSelect;
