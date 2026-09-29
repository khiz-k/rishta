import { biodataProfile, db, updatePage } from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { protectedProcedure } from "../../../orpc/procedures";
import { assertCanEditPage, getHouseholdContext } from "../../households/lib/context";
import { generateUniqueHandle } from "../../households/procedures/create-household";
import { buildMyPage } from "../lib/my-page";
import { definedValues, fullPageSchema } from "../lib/sections";
import { MyPageSchema } from "../types";

export const upsertPage = protectedProcedure
	.route({
		method: "POST",
		path: "/profiles",
		tags: ["Profiles"],
		summary: "Write the whole page at once",
		description: "The guided first write. In-place edits use profiles.patch.",
	})
	.input(fullPageSchema.extend({ organizationId: z.string() }))
	.output(MyPageSchema)
	.handler(async ({ input, context: { user } }) => {
		const context = await getHouseholdContext(input.organizationId, user.id);
		assertCanEditPage(context);

		const { organizationId, ...values } = input;
		const changes = definedValues(values);

		if (context.page) {
			await updatePage(organizationId, changes);
		} else {
			await db.insert(biodataProfile).values({
				...changes,
				displayName: values.displayName,
				organizationId,
				handle: await generateUniqueHandle(),
				userId: context.role === "owner" ? user.id : null,
				claimedAt: context.role === "owner" ? new Date() : null,
			});
		}

		const myPage = await buildMyPage(await getHouseholdContext(organizationId, user.id));
		if (!myPage) {
			fail("NOT_FOUND", "PAGE_NOT_FOUND");
		}
		return myPage;
	});
