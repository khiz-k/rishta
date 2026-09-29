import { and, asc, desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";

import { db, type DbExecutor } from "../client";
import type { Gender } from "../domain";
import {
	biodataPhoto,
	biodataProfile,
	biodataTranslation,
	partnerPreference,
	type BiodataProfileInsert,
} from "../schema/postgres";

const photosByPosition = { orderBy: [asc(biodataPhoto.position)] };

export async function getPageByHandle(handle: string) {
	return db.query.biodataProfile.findFirst({
		where: eq(biodataProfile.handle, handle),
		with: { photos: photosByPosition },
	});
}

export async function getPageById(id: string) {
	return db.query.biodataProfile.findFirst({
		where: eq(biodataProfile.id, id),
		with: { photos: photosByPosition },
	});
}

export async function getPageByOrganizationId(organizationId: string) {
	return db.query.biodataProfile.findFirst({
		where: eq(biodataProfile.organizationId, organizationId),
		with: { photos: photosByPosition },
	});
}

export async function getPageByUserId(userId: string) {
	return db.query.biodataProfile.findFirst({
		where: eq(biodataProfile.userId, userId),
		with: { photos: photosByPosition },
	});
}

export async function getPagesByUserIds(userIds: string[]) {
	if (userIds.length === 0) {
		return [];
	}
	return db.query.biodataProfile.findMany({
		where: inArray(biodataProfile.userId, userIds),
		with: { photos: photosByPosition },
	});
}

export async function getPagesByIds(ids: string[]) {
	if (ids.length === 0) {
		return [];
	}
	return db.query.biodataProfile.findMany({
		where: inArray(biodataProfile.id, ids),
		with: { photos: photosByPosition },
	});
}

export async function isHandleTaken(handle: string) {
	const row = await db.query.biodataProfile.findFirst({
		where: eq(biodataProfile.handle, handle),
		columns: { id: true },
	});
	return Boolean(row);
}

export async function updatePage(
	organizationId: string,
	values: Partial<BiodataProfileInsert>,
	executor: DbExecutor = db,
) {
	const [updated] = await executor
		.update(biodataProfile)
		.set({ ...values, updatedAt: new Date() })
		.where(eq(biodataProfile.organizationId, organizationId))
		.returning();
	return updated;
}

export async function getPreferenceByOrganizationId(organizationId: string) {
	return db.query.partnerPreference.findFirst({
		where: eq(partnerPreference.organizationId, organizationId),
	});
}

export async function getPreferencesByOrganizationIds(organizationIds: string[]) {
	if (organizationIds.length === 0) {
		return [];
	}
	return db.query.partnerPreference.findMany({
		where: inArray(partnerPreference.organizationId, organizationIds),
	});
}

/**
 * The pool a folio is drawn from (spec.md §7, rule 1-2): active, claimed, published pages of the
 * gender the household seeks, in other households, whose own looking-for seeks the candidate's
 * gender. Blocks, letters, history and dealbreakers are applied by the caller.
 */
export async function getFolioPool(params: {
	excludeOrganizationId: string;
	gender: Gender;
	seekingGender: Gender;
	limit?: number;
}) {
	const rows = await db
		.select({ profile: biodataProfile, preference: partnerPreference })
		.from(biodataProfile)
		.innerJoin(
			partnerPreference,
			eq(partnerPreference.organizationId, biodataProfile.organizationId),
		)
		.where(
			and(
				eq(biodataProfile.status, "active"),
				isNotNull(biodataProfile.userId),
				isNotNull(biodataProfile.publishedAt),
				ne(biodataProfile.organizationId, params.excludeOrganizationId),
				eq(biodataProfile.gender, params.gender),
				eq(partnerPreference.seeking, params.seekingGender),
			),
		)
		.orderBy(desc(biodataProfile.publishedAt))
		.limit(params.limit ?? 2000);

	const profileIds = rows.map((row) => row.profile.id);
	const photos =
		profileIds.length > 0
			? await db
					.select({
						profileId: biodataPhoto.profileId,
						visibility: biodataPhoto.visibility,
					})
					.from(biodataPhoto)
					.where(inArray(biodataPhoto.profileId, profileIds))
			: [];

	return rows.map((row) => ({
		...row,
		photoVisibilities: photos
			.filter((photo) => photo.profileId === row.profile.id)
			.map((photo) => photo.visibility),
	}));
}

export async function getPhotoById(id: string) {
	return db.query.biodataPhoto.findFirst({ where: eq(biodataPhoto.id, id) });
}

export async function countPhotos(profileId: string) {
	const [row] = await db
		.select({ count: sql<number>`count(*)` })
		.from(biodataPhoto)
		.where(eq(biodataPhoto.profileId, profileId));
	return Number(row?.count ?? 0);
}

export async function getCachedTranslation(params: {
	profileId: string;
	language: (typeof biodataTranslation.$inferSelect)["language"];
	sourceUpdatedAt: Date;
}) {
	return db.query.biodataTranslation.findFirst({
		where: and(
			eq(biodataTranslation.profileId, params.profileId),
			eq(biodataTranslation.language, params.language),
			eq(biodataTranslation.sourceUpdatedAt, params.sourceUpdatedAt),
		),
	});
}

/** The newest translation for a language, whatever the source version (used as a stale fallback). */
export async function getLatestTranslation(params: {
	profileId: string;
	language: (typeof biodataTranslation.$inferSelect)["language"];
}) {
	return db.query.biodataTranslation.findFirst({
		where: and(
			eq(biodataTranslation.profileId, params.profileId),
			eq(biodataTranslation.language, params.language),
		),
		orderBy: [desc(biodataTranslation.sourceUpdatedAt)],
	});
}

export async function saveTranslation(values: typeof biodataTranslation.$inferInsert) {
	await db.insert(biodataTranslation).values(values).onConflictDoNothing();
}
