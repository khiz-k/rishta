import { updatePage } from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { assertCanEditPage, getHouseholdContext, requirePage } from "../../households/lib/context";
import { buildMyPage } from "../lib/my-page";
import { definedValues, pageSectionPatchSchema } from "../lib/sections";
import { MyPageSchema } from "../types";

export const patchPage = protectedProcedure
	.route({
		method: "PATCH",
		path: "/profiles",
		tags: ["Profiles"],
		summary: "Edit one section of the page in place",
	})
	.input(z.intersection(z.object({ organizationId: z.string() }), pageSectionPatchSchema))
	.output(MyPageSchema)
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		assertCanEditPage(context);
		requirePage(context);

		const changes = definedValues(input.values);
		const updated = await updatePage(input.organizationId, changes);
		if (!updated) {
			fail("NOT_FOUND", "PAGE_NOT_FOUND");
		}

		const myPage = await buildMyPage(context);
		if (!myPage) {
			fail("NOT_FOUND", "PAGE_NOT_FOUND");
		}
		return myPage;
	});
