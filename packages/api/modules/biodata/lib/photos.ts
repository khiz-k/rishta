import type { BiodataPhotoRow, PhotoVisibility } from "@repo/database";
import { logger } from "@repo/logs";
import { getSignedUrl } from "@repo/storage";

import type { PageRelationship } from "../types";

/** Seed and legacy photos are referenced by URL with this prefix and served as-is. */
export const EXTERNAL_STORAGE_PREFIX = "external:";

/** Clear images are short-lived; veils can live a little longer. */
const CLEAR_URL_TTL_SECONDS = 5 * 60;
const VEIL_URL_TTL_SECONDS = 30 * 60;

export const MAX_PHOTOS_PER_PAGE = 5;

export async function resolveStorageUrl(key: string, variant: "clear" | "veil") {
	if (key.startsWith(EXTERNAL_STORAGE_PREFIX)) {
		return key.slice(EXTERNAL_STORAGE_PREFIX.length);
	}

	try {
		return await getSignedUrl(key, {
			bucket: "biodataPhotos",
			expiresIn: variant === "clear" ? CLEAR_URL_TTL_SECONDS : VEIL_URL_TTL_SECONDS,
		});
	} catch (error) {
		// Storage not configured (local demo): the photo box shows its empty state.
		logger.warn("Could not sign a biodata photo URL", { error: String(error) });
		return "";
	}
}

/**
 * Whether a photo is clear for a reader. Non-matches only ever receive the server-made veil,
 * never the clear image (claude.md rule 10). `after_note` photos open to the people this page
 * has written to; family links are always veiled.
 */
export function isPhotoClearFor(visibility: PhotoVisibility, relationship: PageRelationship) {
	switch (relationship) {
		case "self":
		case "household":
		case "introduced":
			return true;
		case "wrote_to_me":
			return visibility === "everyone" || visibility === "after_note";
		case "i_wrote":
		case "stranger":
			return visibility === "everyone";
		case "family_link":
			return false;
	}
}

export async function toPagePhotos(photos: BiodataPhotoRow[], relationship: PageRelationship) {
	return Promise.all(
		photos.map(async (photo) => {
			const clear = isPhotoClearFor(photo.visibility, relationship);
			return {
				id: photo.id,
				url: await resolveStorageUrl(
					clear ? photo.storageKey : photo.veilKey,
					clear ? "clear" : "veil",
				),
				veiled: !clear,
				width: photo.width,
				height: photo.height,
			};
		}),
	);
}

/** The owner's view of their photos: both variants, for the photo manager. */
export async function toOwnerPhotos(photos: BiodataPhotoRow[]) {
	return Promise.all(
		photos.map(async (photo) => ({
			id: photo.id,
			position: photo.position,
			visibility: photo.visibility,
			width: photo.width,
			height: photo.height,
			url: await resolveStorageUrl(photo.storageKey, "clear"),
			veilUrl: await resolveStorageUrl(photo.veilKey, "veil"),
		})),
	);
}
