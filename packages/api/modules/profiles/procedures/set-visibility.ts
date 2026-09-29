import {
	FIELD_VISIBILITIES,
	MATCHING_ONLY_FIELDS,
	updatePage,
	VISIBLE_FIELDS,
} from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { requireHousehold, requirePage } from "../../households/lib/context";
import { FieldVisibilityMapSchema } from "../types";

export const setFieldVisibility = protectedProcedure
	.route({
		method: "POST",
		path: "/profiles/visibility",
		tags: ["Profiles"],
		summary: "Set a field to Shown, Sealed or Matching only",
	})
	.input(
		z.object({
			organizationId: z.string(),
			field: z.enum(VISIBLE_FIELDS),
			visibility: z.enum(FIELD_VISIBILITIES),
		}),
	)
	.output(z.object({ fieldVisibility: FieldVisibilityMapSchema }))
	.handler(async ({ input, context: { user } }) => {
		const context = await requireHousehold(input.organizationId, user.id, ["owner"]);
		const page = requirePage(context);

		// Matching only is offered for special-category fields, with explicit consent copy.
		if (input.visibility === "matching_only" && !MATCHING_ONLY_FIELDS.includes(input.field)) {
			fail("BAD_REQUEST", "VISIBILITY_NOT_ALLOWED");
		}
		// Contact opens only when both say yes.
		if (input.field === "contactPhone" && input.visibility !== "sealed") {
			fail("BAD_REQUEST", "VISIBILITY_NOT_ALLOWED");
		}

		const fieldVisibility = { ...page.fieldVisibility, [input.field]: input.visibility };
		await updatePage(input.organizationId, { fieldVisibility });
		return { fieldVisibility };
	});
