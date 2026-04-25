import { db, partnerPreference } from "@repo/database";
import { eq } from "drizzle-orm";

import { protectedProcedure } from "../../../orpc/procedures";

export const getPreferences = protectedProcedure
	.route({
		method: "GET",
		path: "/preferences",
		tags: ["Preferences"],
		summary: "Get partner preferences",
	})
	.handler(async ({ context: { user } }) => {
		return await db.query.partnerPreference.findFirst({
			where: eq(partnerPreference.userId, user.id),
		});
	});
