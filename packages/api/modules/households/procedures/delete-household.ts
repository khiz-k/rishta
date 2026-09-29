import { biodataPhoto, db, organization } from "@repo/database";
import { logger } from "@repo/logs";
import { deleteObject } from "@repo/storage";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { EXTERNAL_STORAGE_PREFIX } from "../../biodata/lib/photos";
import { OkSchema } from "../../biodata/types";
import { requireHousehold } from "../lib/context";

/**
 * "Delete everything" for a household: photos in storage, then the household itself; every
 * page, letter, message, read, link and note cascades. Account deletion stays with the
 * template's DeleteAccountForm.
 */
export const deleteHousehold = protectedProcedure
	.route({
		method: "DELETE",
		path: "/households/{organizationId}",
		tags: ["Households"],
		summary: "Delete the household and all its data",
	})
	.input(z.object({ organizationId: z.string() }))
	.output(OkSchema)
	.handler(async ({ input, context: { user } }) => {
		await requireHousehold(input.organizationId, user.id, ["owner"]);

		const photos = await db.query.biodataPhoto.findMany({
			where: eq(biodataPhoto.organizationId, input.organizationId),
			columns: { storageKey: true, veilKey: true },
		});
		for (const photo of photos) {
			for (const key of [photo.storageKey, photo.veilKey]) {
				if (key.startsWith(EXTERNAL_STORAGE_PREFIX)) {
					continue;
				}
				try {
					await deleteObject(key, { bucket: "biodataPhotos" });
				} catch (error) {
					logger.error(error, { ctx: "deleteHousehold", key });
				}
			}
		}

		await db.delete(organization).where(eq(organization.id, input.organizationId));
		return { ok: true as const };
	});
