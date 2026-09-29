import { db, familyLink, getFamilyLinkById } from "@repo/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { OkSchema } from "../../biodata/types";
import { assertHouseholdRole, getHouseholdRow } from "../../households/lib/context";

export const revokeFamilyLink = protectedProcedure
	.route({
		method: "POST",
		path: "/family-links/{linkId}/revoke",
		tags: ["Family links"],
		summary: "Close a family link",
	})
	.input(z.object({ linkId: z.string() }))
	.output(OkSchema)
	.handler(async ({ input, context: { user } }) => {
		const { row: link, context } = await getHouseholdRow(
			await getFamilyLinkById(input.linkId),
			user.id,
			"FAMILY_LINK_NOT_FOUND",
		);
		assertHouseholdRole(context, ["owner", "admin"]);
		if (!link.revokedAt) {
			await db
				.update(familyLink)
				.set({ revokedAt: new Date() })
				.where(eq(familyLink.id, link.id));
		}
		return { ok: true as const };
	});
