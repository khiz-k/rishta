import { biodataPhoto, db, PHOTO_VISIBILITIES } from "@repo/database";
import { z } from "zod";

import { fail } from "../../../../lib/errors";
import { protectedProcedure } from "../../../../orpc/procedures";
import { MAX_PHOTOS_PER_PAGE, toOwnerPhotos } from "../../../biodata/lib/photos";
import { PhotoSchema } from "../../../biodata/types";
import {
	assertCanEditPage,
	getHouseholdContext,
	requirePage,
} from "../../../households/lib/context";

export const addPhoto = protectedProcedure
	.route({
		method: "POST",
		path: "/profiles/photos",
		tags: ["Profiles"],
		summary: "Add an uploaded photo to the page",
	})
	.input(
		z.object({
			organizationId: z.string(),
			storageKey: z.string().min(1),
			veilKey: z.string().min(1),
			width: z.number().int().min(1).max(10000),
			height: z.number().int().min(1).max(10000),
			visibility: z.enum(PHOTO_VISIBILITIES).optional(),
		}),
	)
	.output(PhotoSchema)
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		assertCanEditPage(context);
		const page = requirePage(context);

		const prefix = `${input.organizationId}/`;
		if (!input.storageKey.startsWith(prefix) || !input.veilKey.startsWith(prefix)) {
			fail("BAD_REQUEST", "INVALID_STORAGE_KEY");
		}

		const taken = new Set(page.photos.map((photo) => photo.position));
		if (page.photos.length >= MAX_PHOTOS_PER_PAGE) {
			fail("PRECONDITION_FAILED", "PHOTO_LIMIT");
		}
		const position = [0, 1, 2, 3, 4].find((candidate) => !taken.has(candidate)) ?? 0;

		const [created] = await db
			.insert(biodataPhoto)
			.values({
				profileId: page.id,
				organizationId: input.organizationId,
				storageKey: input.storageKey,
				veilKey: input.veilKey,
				width: input.width,
				height: input.height,
				position,
				visibility: input.visibility ?? "after_yes",
			})
			.returning();

		if (!created) {
			fail("INTERNAL_SERVER_ERROR", "PHOTO_NOT_FOUND");
		}
		const [photo] = await toOwnerPhotos([created]);
		if (!photo) {
			fail("INTERNAL_SERVER_ERROR", "PHOTO_NOT_FOUND");
		}
		return photo;
	});
