import { isAiConfigured } from "@repo/ai";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const getAiStatus = protectedProcedure
	.route({
		method: "GET",
		path: "/ai/status",
		tags: ["AI"],
		summary: "Whether AI assists are configured",
		description:
			"Every AI surface has a working fallback, so the UI only uses this to choose its wording.",
	})
	.input(z.object({}).optional())
	.output(z.object({ enabled: z.boolean() }))
	.handler(() => ({ enabled: isAiConfigured() }));
