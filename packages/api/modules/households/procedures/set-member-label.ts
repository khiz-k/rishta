import { db, householdSetting } from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { getHouseholdContext } from "../lib/context";

/** Relation labels ("Ammi", "Bhaiya") sign pencil notes. The owner sets anyone's; members their own. */
export const setMemberLabel = protectedProcedure
	.route({
		method: "POST",
		path: "/households/{organizationId}/member-label",
		tags: ["Households"],
		summary: "Set a household member's relation label",
	})
	.input(
		z.object({
			organizationId: z.string(),
			userId: z.string(),
			label: z.string().trim().max(40).nullable(),
		}),
	)
	.output(z.object({ memberLabels: z.record(z.string(), z.string()) }))
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		if (context.role !== "owner" && input.userId !== user.id) {
			fail("FORBIDDEN", "ROLE_NOT_ALLOWED");
		}

		const memberLabels = { ...context.settings.memberLabels };
		if (input.label && input.label.length > 0) {
			memberLabels[input.userId] = input.label;
		} else {
			delete memberLabels[input.userId];
		}

		await db
			.insert(householdSetting)
			.values({ ...context.settings, organizationId: input.organizationId, memberLabels })
			.onConflictDoUpdate({
				target: householdSetting.organizationId,
				set: { memberLabels, updatedAt: new Date() },
			});

		return { memberLabels };
	});
