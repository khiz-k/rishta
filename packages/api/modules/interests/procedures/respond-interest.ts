import { db, interest } from "@repo/database";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const respondInterest = protectedProcedure
	.route({
		method: "POST",
		path: "/interests/respond",
		tags: ["Interests"],
		summary: "Accept or decline an interest",
	})
	.input(
		z.object({
			interestId: z.string(),
			action: z.enum(["accepted", "declined"]),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const [updated] = await db
			.update(interest)
			.set({ status: input.action, updatedAt: new Date() })
			.where(and(eq(interest.id, input.interestId), eq(interest.toUserId, user.id)))
			.returning();

		return updated;
	});
