import { biodataProfile, db, householdSetting } from "@repo/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { requireHousehold } from "../lib/context";
import { inviteCandidateToHousehold } from "./create-household";

export const inviteCandidate = protectedProcedure
	.route({
		method: "POST",
		path: "/households/{organizationId}/invite-candidate",
		tags: ["Households"],
		summary: "Invite the candidate to claim a drafted page",
	})
	.input(z.object({ organizationId: z.string(), email: z.email() }))
	.output(z.object({ invitationId: z.string().nullable() }))
	.handler(async ({ input, context: { user, headers } }) => {
		const context = await requireHousehold(input.organizationId, user.id, ["owner", "admin"]);
		if (context.page?.userId) {
			fail("CONFLICT", "ALREADY_CLAIMED");
		}

		const email = input.email.toLowerCase();
		await db
			.update(householdSetting)
			.set({ pendingCandidateEmail: email })
			.where(eq(householdSetting.organizationId, input.organizationId));
		await db
			.update(biodataProfile)
			.set({ status: "awaiting_claim" })
			.where(eq(biodataProfile.organizationId, input.organizationId));

		const invitationId = await inviteCandidateToHousehold({
			headers,
			organizationId: input.organizationId,
			email,
		});

		return { invitationId };
	});
