import { ORPCError } from "@orpc/client";
import { config as authConfig } from "@repo/auth/config";
import { getOrganizationBySlug } from "@repo/database";
import slugify from "@sindresorhus/slugify";
import { nanoid } from "nanoid";
import { z } from "zod";

import { publicProcedure } from "../../../orpc/procedures";

export const generateOrganizationSlug = publicProcedure
	.route({
		method: "GET",
		path: "/organizations/generate-slug",
		tags: ["Organizations"],
		summary: "Generate organization slug",
		description: "Generate a unique slug from an organization name",
	})
	.input(
		z.object({
			name: z.string(),
		}),
	)
	.handler(async ({ input: { name } }) => {
		const baseSlug = slugify(name, {
			lowercase: true,
		});

		// A route word ("letters", "b", …) is never a household's address.
		const forbidden: readonly string[] = authConfig.organizations.forbiddenOrganizationSlugs;
		let slug = forbidden.includes(baseSlug) ? `${baseSlug}-${nanoid(5)}` : baseSlug;
		let hasAvailableSlug = false;

		for (let i = 0; i < 3; i++) {
			const existing = await getOrganizationBySlug(slug);

			if (!existing) {
				hasAvailableSlug = true;
				break;
			}

			slug = `${baseSlug}-${nanoid(5)}`;
		}

		if (!hasAvailableSlug) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}

		return { slug };
	});
