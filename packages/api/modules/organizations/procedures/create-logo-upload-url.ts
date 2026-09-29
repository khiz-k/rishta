import { ORPCError } from "@orpc/server";
import { getOrganizationById } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import z from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../lib/membership";

export const createLogoUploadUrl = protectedProcedure
	.route({
		method: "POST",
		path: "/organizations/logo-upload-url",
		tags: ["Organizations"],
		summary: "Create logo upload URL",
		description: "Create a signed upload URL to upload an logo image to the storage bucket",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ context: { user }, input: { organizationId } }) => {
		// Membership first, so a stranger cannot probe which households exist. The logo is a
		// household setting, which only the owner changes (spec.md §13).
		const membership = await verifyOrganizationMembership(organizationId, user.id);

		if (!membership) {
			fail("FORBIDDEN", "NOT_A_MEMBER");
		}
		if (membership.role !== "owner") {
			fail("FORBIDDEN", "ROLE_NOT_ALLOWED");
		}

		const organization = await getOrganizationById(organizationId);

		if (!organization) {
			throw new ORPCError("BAD_REQUEST");
		}

		const path = `${organizationId}.png`;
		const signedUploadUrl = await getSignedUploadUrl(path, {
			bucket: "avatars",
		});

		return { signedUploadUrl, path };
	});
