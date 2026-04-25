import { db, shortlist } from "@repo/database";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const toggleShortlist = protectedProcedure
	.route({
		method: "POST",
		path: "/shortlists/toggle",
		tags: ["Shortlists"],
		summary: "Add or remove a profile from shortlist",
	})
	.input(z.object({ profileUserId: z.string() }))
	.handler(async ({ context: { user }, input }) => {
		const existing = await db.query.shortlist.findFirst({
			where: and(eq(shortlist.userId, user.id), eq(shortlist.profileUserId, input.profileUserId)),
		});

		if (existing) {
			await db.delete(shortlist).where(eq(shortlist.id, existing.id));
			return { shortlisted: false };
		}

		await db.insert(shortlist).values({ userId: user.id, profileUserId: input.profileUserId });
		return { shortlisted: true };
	});
