import { getPreferenceByOrganizationId, PartnerPreferenceSchema } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { getHouseholdContext } from "../../households/lib/context";

export const getPreferences = protectedProcedure
	.route({
		method: "GET",
		path: "/preferences",
		tags: ["Preferences"],
		summary: "Get what the household is looking for",
	})
	.input(z.object({ organizationId: z.string() }))
	.output(PartnerPreferenceSchema.nullable())
	.handler(async ({ input, context: { user } }) => {
		await getHouseholdContext(input.organizationId, user.id);
		const preference = await getPreferenceByOrganizationId(input.organizationId);
		if (!preference) {
			return null;
		}
		const {
			willingToRelocate: _a,
			requiresCitizenship: _b,
			quizComplete: _c,
			...rest
		} = preference;
		return rest;
	});
