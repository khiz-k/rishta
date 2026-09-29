import { db, FAMILY_REACTIONS, listFamilyLinks, marginNote, PAGE_LANGUAGES } from "@repo/database";
import { inArray } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { requireHousehold } from "../../households/lib/context";

export const listFamilyLinksProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/family-links",
		tags: ["Family links"],
		summary: "The household's family links",
	})
	.input(z.object({ organizationId: z.string() }))
	.output(
		z.array(
			z.object({
				id: z.string(),
				recipientLabel: z.string(),
				pageName: z.string(),
				pageHandle: z.string(),
				language: z.enum(PAGE_LANGUAGES),
				expiresAt: z.string(),
				openCount: z.number().int(),
				state: z.enum(["open", "expired", "revoked"]),
				reaction: z.enum(FAMILY_REACTIONS).nullable(),
				reactionText: z.string().nullable(),
			}),
		),
	)
	.handler(async ({ input, context: { user } }) => {
		await requireHousehold(input.organizationId, user.id, ["owner", "admin"]);
		const links = await listFamilyLinks(input.organizationId);
		const reactions =
			links.length > 0
				? await db.query.marginNote.findMany({
						where: inArray(
							marginNote.familyLinkId,
							links.map((link) => link.id),
						),
					})
				: [];
		const byLink = new Map(reactions.map((note) => [note.familyLinkId, note]));
		const now = Date.now();

		return links.map((link) => ({
			id: link.id,
			recipientLabel: link.recipientLabel,
			pageName: link.profile.displayName,
			pageHandle: link.profile.handle,
			language: link.language,
			expiresAt: link.expiresAt.toISOString(),
			openCount: link.openCount,
			state: link.revokedAt
				? ("revoked" as const)
				: link.expiresAt.getTime() <= now
					? ("expired" as const)
					: ("open" as const),
			reaction: byLink.get(link.id)?.reaction ?? null,
			reactionText: byLink.get(link.id)?.text ?? null,
		}));
	});
