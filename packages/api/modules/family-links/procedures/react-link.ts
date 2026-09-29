import {
	FAMILY_REACTIONS,
	getHouseholdById,
	getPageByOrganizationId,
	upsertLinkReaction,
} from "@repo/database";
import { z } from "zod";

import { fail } from "../../../lib/errors";
import { consumeRateLimit, getClientIp } from "../../../lib/rate-limit";
import { publicProcedure } from "../../../orpc/procedures";
import { OkSchema } from "../../biodata/types";
import { notifyUser } from "../../notifications/lib/notify";
import { resolveFamilyLink } from "../lib/open-link";

export const reactFamilyLink = publicProcedure
	.route({
		method: "POST",
		path: "/family-links/react",
		tags: ["Family links"],
		summary: "Proceed, Let's talk or Not for us (no account)",
		description:
			"Saved on tap and changeable until the link closes. It never changes a letter's state.",
	})
	.input(
		z
			.object({
				token: z.string().min(1).max(200),
				reaction: z.enum(FAMILY_REACTIONS).optional(),
				text: z.string().trim().max(280).optional(),
			})
			.refine((value) => Boolean(value.reaction || value.text), {
				message: "Choose a reaction or add a few words",
			}),
	)
	.output(OkSchema)
	.handler(async ({ input, context: { headers } }) => {
		if (!consumeRateLimit(`family-link-react:ip:${getClientIp(headers)}`, 30, 60_000)) {
			fail("TOO_MANY_REQUESTS", "RATE_LIMITED");
		}

		const resolved = await resolveFamilyLink(input.token);
		if (resolved.state === "closed") {
			fail("CONFLICT", "FAMILY_LINK_CLOSED");
		}
		const { link, page } = resolved;

		await upsertLinkReaction({
			organizationId: link.organizationId,
			profileId: page.id,
			familyLinkId: link.id,
			authorLabel: link.recipientLabel,
			reaction: input.reaction ?? null,
			text: input.text && input.text.length > 0 ? input.text : null,
		});

		const candidate = (await getPageByOrganizationId(link.organizationId))?.userId;
		if (candidate) {
			const household = await getHouseholdById(link.organizationId);
			await notifyUser({
				userId: candidate,
				copy: "FAMILY_REACTION",
				// Never "//folio/kept": that would read as a host name, not a path.
				link: household ? `/${household.slug}/folio/kept` : "/",
				values: { author: link.recipientLabel },
				// Family reactions are in-app only by default.
				email: false,
				data: { profileId: page.id },
			});
		}

		return { ok: true as const };
	});
