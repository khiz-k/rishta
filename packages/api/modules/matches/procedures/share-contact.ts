import { db, getMatchById, getPageByUserId, match as matchTable } from "@repo/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { assertParticipant } from "../lib/view";

export const shareContact = protectedProcedure
	.route({
		method: "POST",
		path: "/matches/{matchId}/share",
		tags: ["Introductions"],
		summary: "Share a phone number or a family contact",
		description:
			"Family contacts are seen only once both have shared; the stage then becomes families.",
	})
	.input(z.object({ matchId: z.string(), kind: z.enum(["phone", "family"]) }))
	.output(
		z.object({
			shared: z.literal(true),
			stage: z.enum(["introduced", "call_booked", "families", "closed"]),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const match = await getMatchById(input.matchId);
		assertParticipant(match, user.id);
		if (match.stage === "closed") {
			fail("CONFLICT", "MATCH_CLOSED");
		}
		const page = await getPageByUserId(user.id);
		const isA = match.userAId === user.id;

		if (input.kind === "phone") {
			if (!page?.contactPhone) {
				fail("PRECONDITION_FAILED", "NO_PHONE_ON_PAGE");
			}
			await db
				.update(matchTable)
				.set(isA ? { phoneSharedByA: true } : { phoneSharedByB: true })
				.where(eq(matchTable.id, match.id));
			return { shared: true as const, stage: match.stage };
		}

		if (!page?.familyContactName || !page.familyContactPhone) {
			fail("PRECONDITION_FAILED", "NO_FAMILY_CONTACT");
		}
		const otherShared = isA ? match.familySharedByB : match.familySharedByA;
		const stage = otherShared ? "families" : match.stage;
		await db
			.update(matchTable)
			.set({ ...(isA ? { familySharedByA: true } : { familySharedByB: true }), stage })
			.where(eq(matchTable.id, match.id));
		return { shared: true as const, stage };
	});
