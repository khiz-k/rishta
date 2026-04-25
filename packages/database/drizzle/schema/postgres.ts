import { createId as cuid } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const purchaseTypeEnum = pgEnum("PurchaseType", ["SUBSCRIPTION", "ONE_TIME"]);

export const notificationTypeEnum = pgEnum("NotificationType", ["WELCOME", "APP_UPDATE"]);

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
	partnerPreference: one(partnerPreference),
	sentInterests: many(interest, { relationName: "sentInterests" }),
	receivedInterests: many(interest, { relationName: "receivedInterests" }),
	shortlists: many(shortlist, { relationName: "shortlists" }),
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

export const organizationRelations = relations(organization, ({ many }) => ({
	members: many(member),
	invitations: many(invitation),

	purchases: many(purchase),
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

// ===== Rishta Domain Tables =====

export const biodataProfile = pgTable(
	"biodata_profile",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		userId: text("userId")
			.notNull()
			.unique()
			.references(() => user.id, { onDelete: "cascade" }),
		displayName: text("displayName").notNull(),
		gender: text("gender").notNull(), // "male", "female"
		dateOfBirth: text("dateOfBirth").notNull(), // YYYY-MM-DD
		height: integer("height"), // cm
		religion: text("religion").notNull(),
		community: text("community"),
		motherTongue: text("motherTongue"),
		maritalStatus: text("maritalStatus").notNull().default("never_married"),
		education: text("education"),
		university: text("university"),
		profession: text("profession"),
		employer: text("employer"),
		incomeRange: text("incomeRange"),
		familyType: text("familyType"),
		fatherOccupation: text("fatherOccupation"),
		motherOccupation: text("motherOccupation"),
		siblings: text("siblings"),
		diet: text("diet").notNull().default("non_veg"),
		smoking: text("smoking").notNull().default("never"),
		drinking: text("drinking").notNull().default("never"),
		aboutMe: text("aboutMe"),
		lookingFor: text("lookingFor"),
		createdBy: text("createdBy").notNull().default("self"), // "self", "parent", "sibling", "relative"
		location: text("location"),
		isActive: boolean("isActive").default(true).notNull(),
		isVerified: boolean("isVerified").default(false).notNull(),
		profilePhoto: text("profilePhoto"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("biodata_profile_userId_idx").on(table.userId),
		index("biodata_profile_gender_idx").on(table.gender),
		index("biodata_profile_religion_idx").on(table.religion),
	],
);

export const partnerPreference = pgTable(
	"partner_preference",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		userId: text("userId")
			.notNull()
			.unique()
			.references(() => user.id, { onDelete: "cascade" }),
		ageMin: integer("ageMin"),
		ageMax: integer("ageMax"),
		heightMin: integer("heightMin"),
		heightMax: integer("heightMax"),
		religions: text("religions"), // JSON array string
		communities: text("communities"),
		educationLevels: text("educationLevels"),
		professions: text("professions"),
		locations: text("locations"),
		diet: text("diet"),
		maritalStatus: text("maritalStatus"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("partner_preference_userId_idx").on(table.userId)],
);

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
		status: text("status").notNull().default("pending"), // "pending", "accepted", "declined", "withdrawn"
		message: text("message"),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		updatedAt: timestamp("updatedAt")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("interest_fromUserId_idx").on(table.fromUserId),
		index("interest_toUserId_idx").on(table.toUserId),
		uniqueIndex("interest_from_to_uidx").on(table.fromUserId, table.toUserId),
	],
);

export const shortlist = pgTable(
	"shortlist",
	{
		id: text("id")
			.$defaultFn(() => cuid())
			.primaryKey(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		profileUserId: text("profileUserId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("createdAt").defaultNow().notNull(),
	},
	(table) => [
		index("shortlist_userId_idx").on(table.userId),
		uniqueIndex("shortlist_user_profile_uidx").on(table.userId, table.profileUserId),
	],
);

// ===== Rishta Relations =====

export const biodataProfileRelations = relations(biodataProfile, ({ one }) => ({
	user: one(user, {
		fields: [biodataProfile.userId],
		references: [user.id],
	}),
}));

export const partnerPreferenceRelations = relations(partnerPreference, ({ one }) => ({
	user: one(user, {
		fields: [partnerPreference.userId],
		references: [user.id],
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
}));

export const shortlistRelations = relations(shortlist, ({ one }) => ({
	user: one(user, {
		fields: [shortlist.userId],
		references: [user.id],
		relationName: "shortlists",
	}),
	profileUser: one(user, {
		fields: [shortlist.profileUserId],
		references: [user.id],
	}),
}));

