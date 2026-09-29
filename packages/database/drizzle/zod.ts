import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

import { FIELD_VISIBILITIES, VISIBLE_FIELDS } from "./domain";
import {
	account,
	biodataProfile,
	partnerPreference,
	invitation,
	member,
	notification,
	organization,
	passkey,
	purchase,
	session,
	user,
	userNotificationPreference,
	verification,
} from "./schema";

export const UserSchema = createSelectSchema(user);
export const UserUpdateSchema = createUpdateSchema(user, {
	id: z.string(),
});
export const OrganizationSchema = createSelectSchema(organization);
export const OrganizationUpdateSchema = createUpdateSchema(organization, {
	id: z.string(),
});
export const MemberSchema = createSelectSchema(member);
export const InvitationSchema = createSelectSchema(invitation);
export const PurchaseSchema = createSelectSchema(purchase);
export type Purchase = typeof purchase.$inferSelect;
export const PurchaseInsertSchema = createInsertSchema(purchase);
export const PurchaseUpdateSchema = createUpdateSchema(purchase, {
	id: z.string(),
});
export const SessionSchema = createSelectSchema(session);
export const AccountSchema = createSelectSchema(account);
export const VerificationSchema = createSelectSchema(verification);
export const PasskeySchema = createSelectSchema(passkey);
export const NotificationSchema = createSelectSchema(notification);
export const NotificationInsertSchema = createInsertSchema(notification);
export const NotificationUpdateSchema = createUpdateSchema(notification, {
	id: z.string(),
});
export type Notification = typeof notification.$inferSelect;
export const UserNotificationPreferenceSchema = createSelectSchema(userNotificationPreference);
export const UserNotificationPreferenceInsertSchema = createInsertSchema(
	userNotificationPreference,
);
export const UserNotificationPreferenceUpdateSchema = createUpdateSchema(
	userNotificationPreference,
	{
		id: z.string(),
	},
);
export type UserNotificationPreference = typeof userNotificationPreference.$inferSelect;

export const FieldVisibilityMapSchema = z.partialRecord(
	z.enum(VISIBLE_FIELDS),
	z.enum(FIELD_VISIBILITIES),
);

/** The household's own page, every field, for the in-place editor. Legacy columns are left out. */
export const BiodataProfileSchema = createSelectSchema(biodataProfile, {
	fieldVisibility: FieldVisibilityMapSchema,
}).omit({ isActive: true, isVerified: true, profilePhoto: true });

/** "Looking for": the household's non-negotiables. */
export const PartnerPreferenceSchema = createSelectSchema(partnerPreference).omit({
	willingToRelocate: true,
	requiresCitizenship: true,
	quizComplete: true,
});
