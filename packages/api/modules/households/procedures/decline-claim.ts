import { db, organization } from "@repo/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { firstNameOf } from "../../biodata/lib/page-view";
import { OkSchema } from "../../biodata/types";
import { notifyUser } from "../../notifications/lib/notify";
import { loadClaimableHousehold } from "./claim-page";

export const declineClaim = protectedProcedure
	.route({
		method: "POST",
		path: "/households/{organizationId}/decline-claim",
		tags: ["Households"],
		summary: "Decline a page a relative drafted",
		description:
			'"This isn\'t something I want": deletes the draft page and household data. No reason is required.',
	})
	.input(z.object({ organizationId: z.string(), note: z.string().trim().max(400).optional() }))
	.output(OkSchema)
	.handler(async ({ input, context: { user } }) => {
		const { household, page } = await loadClaimableHousehold(input.organizationId, user);
		const drafterIds = household.members
			.filter((row) => row.userId !== user.id)
			.map((row) => row.userId);

		// Tell the drafter kindly first; the household (and every row under it) then goes.
		await Promise.all(
			drafterIds.map((drafterId) =>
				notifyUser({
					userId: drafterId,
					copy: "CLAIM_DECLINED",
					link: "/",
					values: { name: firstNameOf(page.displayName) },
					email: true,
					data: input.note ? { note: input.note } : {},
				}),
			),
		);

		await db.delete(organization).where(eq(organization.id, household.id));

		return { ok: true as const };
	});
