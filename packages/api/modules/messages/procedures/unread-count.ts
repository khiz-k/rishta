import { countUnreadMessages } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const unreadCount = protectedProcedure
	.route({
		method: "GET",
		path: "/messages/unread",
		tags: ["Messages"],
		summary: "Unread message count",
	})
	.input(z.object({}).optional())
	.output(z.object({ count: z.number().int() }))
	.handler(async ({ context: { user } }) => ({ count: await countUnreadMessages(user.id) }));
