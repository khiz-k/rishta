import { biodataPhoto, db, getPhotoById, PHOTO_VISIBILITIES } from "@repo/database";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../../lib/errors";
import { protectedProcedure } from "../../../../orpc/procedures";
import { toOwnerPhotos } from "../../../biodata/lib/photos";
import { PhotoSchema } from "../../../biodata/types";
import { assertCanEditPage, getHouseholdRow } from "../../../households/lib/context";

/** Parks a photo outside 0-4 while two photos swap places (the pair is unique per page). */
const SWAP_POSITION = 99;

export const updatePhoto = protectedProcedure
	.route({
		method: "PATCH",
		path: "/profiles/photos/{photoId}",
		tags: ["Profiles"],
		summary: "Change a photo's visibility or position",
	})
	.input(
		z.object({
			photoId: z.string(),
			visibility: z.enum(PHOTO_VISIBILITIES).optional(),
			position: z.number().int().min(0).max(4).optional(),
		}),
	)
	.output(PhotoSchema)
	.handler(async ({ input, context: { user } }) => {
		const { row: photo, context } = await getHouseholdRow(
			await getPhotoById(input.photoId),
			user.id,
			"PHOTO_NOT_FOUND",
		);
		assertCanEditPage(context);

		await db.transaction(async (tx) => {
			if (input.position !== undefined && input.position !== photo.position) {
				const occupant = await tx.query.biodataPhoto.findFirst({
					where: and(
						eq(biodataPhoto.profileId, photo.profileId),
						eq(biodataPhoto.position, input.position),
					),
				});
				if (occupant) {
					await tx
						.update(biodataPhoto)
						.set({ position: SWAP_POSITION })
						.where(eq(biodataPhoto.id, occupant.id));
				}
				await tx
					.update(biodataPhoto)
					.set({ position: input.position })
					.where(eq(biodataPhoto.id, photo.id));
				if (occupant) {
					await tx
						.update(biodataPhoto)
						.set({ position: photo.position })
						.where(eq(biodataPhoto.id, occupant.id));
				}
			}
			if (input.visibility) {
				await tx
					.update(biodataPhoto)
					.set({ visibility: input.visibility })
					.where(eq(biodataPhoto.id, photo.id));
			}
		});

		const updated = await getPhotoById(photo.id);
		const [view] = updated ? await toOwnerPhotos([updated]) : [];
		if (!view) {
			fail("NOT_FOUND", "PHOTO_NOT_FOUND");
		}
		return view;
	});
