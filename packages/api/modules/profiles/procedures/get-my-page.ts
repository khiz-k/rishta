import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { getHouseholdContext } from "../../households/lib/context";
import { buildMyPage } from "../lib/my-page";
import { MyPageSchema } from "../types";

export const getMyPage = protectedProcedure
	.route({
		method: "GET",
		path: "/profiles/me",
		tags: ["Profiles"],
		summary: "The household's own page",
		description:
			"Every field for the in-place editor, with completeness per section and the publish checklist.",
	})
	.input(z.object({ organizationId: z.string() }))
	.output(MyPageSchema)
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		const myPage = await buildMyPage(context);
		if (!myPage) {
			fail("NOT_FOUND", "PAGE_NOT_FOUND");
		}
		return myPage;
	});
