import { randomUUID } from "node:crypto";

import { getSignedUploadUrl } from "@repo/storage";
import { z } from "zod";

import { protectedProcedure } from "../../../../orpc/procedures";
import {
	assertCanEditPage,
	getHouseholdContext,
	requirePage,
} from "../../../households/lib/context";

const EXTENSIONS = { "image/jpeg": "jpg", "image/webp": "webp" } as const;

/**
 * A signed upload URL into the private `biodata-photos` bucket. The client re-encodes each
 * photo (stripping EXIF) and uploads the clear image and its 32px veil separately.
 */
export const createPhotoUploadUrl = protectedProcedure
	.route({
		method: "POST",
		path: "/profiles/photos/upload-url",
		tags: ["Profiles"],
		summary: "Create a signed upload URL for a page photo",
	})
	.input(
		z.object({
			organizationId: z.string(),
			contentType: z.enum(["image/jpeg", "image/webp"]),
			variant: z.enum(["clear", "veil"]),
		}),
	)
	.output(z.object({ signedUploadUrl: z.string(), storageKey: z.string() }))
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		assertCanEditPage(context);
		requirePage(context);

		const storageKey = `${input.organizationId}/${randomUUID()}-${input.variant}.${EXTENSIONS[input.contentType]}`;
		const signedUploadUrl = await getSignedUploadUrl(storageKey, {
			bucket: "biodataPhotos",
			contentType: input.contentType,
		});

		return { signedUploadUrl, storageKey };
	});
