import { BIODATA_STATUSES, getHouseholdsForUser } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

/** For the "Searching for" switcher in the avatar menu (a mother helping two children). */
export const listMyHouseholds = protectedProcedure
	.route({
		method: "GET",
		path: "/households",
		tags: ["Households"],
		summary: "List the households I belong to",
	})
	.output(
		z.array(
			z.object({
				organizationId: z.string(),
				slug: z.string(),
				candidateName: z.string(),
				role: z.string(),
				pageStatus: z.enum(BIODATA_STATUSES).nullable(),
			}),
		),
	)
	.handler(async ({ context: { user } }) => {
		const rows = await getHouseholdsForUser(user.id);
		return rows.map((row) => ({
			organizationId: row.organizationId,
			slug: row.slug,
			candidateName: row.candidateName ?? row.name,
			role: row.role,
			pageStatus: row.pageStatus,
		}));
	});
