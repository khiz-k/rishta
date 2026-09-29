import { biodataPhoto, db, getPhotoById } from "@repo/database";
import { logger } from "@repo/logs";
import { deleteObject } from "@repo/storage";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../../orpc/procedures";
import { EXTERNAL_STORAGE_PREFIX } from "../../../biodata/lib/photos";
import { OkSchema } from "../../../biodata/types";
import { assertCanEditPage, getHouseholdRow } from "../../../households/lib/context";

export const removePhoto = protectedProcedure
	.route({
		method: "DELETE",
		path: "/profiles/photos/{photoId}",
		tags: ["Profiles"],
		summary: "Remove a photo and both stored images",
	})
	.input(z.object({ photoId: z.string() }))
	.output(OkSchema)
	.handler(async ({ input, context: { user } }) => {
		const { row: photo, context } = await getHouseholdRow(
			await getPhotoById(input.photoId),
			user.id,
			"PHOTO_NOT_FOUND",
		);
		assertCanEditPage(context);

		await db.delete(biodataPhoto).where(eq(biodataPhoto.id, photo.id));

		for (const key of [photo.storageKey, photo.veilKey]) {
			if (key.startsWith(EXTERNAL_STORAGE_PREFIX)) {
				continue;
			}
			try {
				await deleteObject(key, { bucket: "biodataPhotos" });
			} catch (error) {
				logger.error(error, { ctx: "removePhoto", key });
			}
		}

		return { ok: true as const };
	});
