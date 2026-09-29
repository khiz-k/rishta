import {
	countActiveFamilyLinks,
	db,
	familyLink,
	getHouseholdSetting,
	getLetterById,
	PAGE_LANGUAGES,
} from "@repo/database";
import { getBaseUrl } from "@repo/utils";
import { z } from "zod";

import { getServerCopy } from "../../../lib/copy";
import { fail } from "../../../lib/errors";
import { DAY_MS } from "../../../lib/time";
import { protectedProcedure } from "../../../orpc/procedures";
import { firstNameOf } from "../../biodata/lib/page-view";
import { isCandidateReader, requireHousehold } from "../../households/lib/context";
import { getEntitlements } from "../../households/lib/entitlements";
import { loadPageForViewer } from "../../profiles/lib/viewer";
import { createFamilyLinkToken } from "../lib/token";

export const createFamilyLink = protectedProcedure
	.route({
		method: "POST",
		path: "/family-links",
		tags: ["Family links"],
		summary: "Show my family: create a private link to a page",
		description:
			"A watermarked, expiring, account-free link. The token is only ever in the returned url; only its hash is stored. Only the candidate can include a letter's note.",
	})
	.input(
		z.object({
			organizationId: z.string(),
			handle: z.string().min(4).max(12),
			recipientLabel: z.string().trim().min(1).max(40),
			language: z.enum(PAGE_LANGUAGES),
			expiresInDays: z.union([z.literal(1), z.literal(3), z.literal(7)]),
			letterId: z.string().optional(),
		}),
	)
	.output(
		z.object({
			linkId: z.string(),
			url: z.string(),
			expiresAt: z.string(),
			shareText: z.string(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const context = await requireHousehold(input.organizationId, user.id, ["owner", "admin"]);
		if (input.letterId && !isCandidateReader(context)) {
			// A letter's note is the candidate's (spec.md F7, §13): a guardian shares the page only.
			fail("FORBIDDEN", "CANDIDATE_ONLY");
		}
		const { page } = await loadPageForViewer(context, input.handle);

		if (page.organizationId !== input.organizationId) {
			const targetSettings = await getHouseholdSetting(page.organizationId);
			if (targetSettings?.familyLinksAllowed === false) {
				// "This family prefers their page isn't shared by link."
				fail("FORBIDDEN", "FAMILY_LINKS_NOT_ALLOWED");
			}
		}

		const entitlements = await getEntitlements(input.organizationId);
		if (
			(await countActiveFamilyLinks(input.organizationId)) >= entitlements.activeFamilyLinks
		) {
			fail("PRECONDITION_FAILED", "FAMILY_LINK_LIMIT", {
				limit: entitlements.activeFamilyLinks,
			});
		}

		let letterId: string | null = null;
		if (input.letterId) {
			const letter = await getLetterById(input.letterId);
			// "Include his note" only for a letter this household received from that page.
			if (
				!letter ||
				letter.toOrganizationId !== input.organizationId ||
				letter.fromUserId !== page.userId
			) {
				fail("NOT_FOUND", "LETTER_NOT_FOUND");
			}
			letterId = letter.id;
		}

		const { token, tokenHash } = createFamilyLinkToken();
		const expiresAt = new Date(Date.now() + input.expiresInDays * DAY_MS);
		const [created] = await db
			.insert(familyLink)
			.values({
				organizationId: input.organizationId,
				createdByUserId: user.id,
				profileId: page.id,
				letterId,
				tokenHash,
				recipientLabel: input.recipientLabel,
				language: input.language,
				expiresAt,
			})
			.returning({ id: familyLink.id });
		if (!created) {
			fail("INTERNAL_SERVER_ERROR", "FAMILY_LINK_NOT_FOUND");
		}

		const url = `${getBaseUrl(process.env.NEXT_PUBLIC_SAAS_URL, 3000)}/f/${token}`;
		const t = await getServerCopy(user.locale);
		const name = firstNameOf(context.page?.displayName ?? user.name);

		return {
			linkId: created.id,
			url,
			expiresAt: expiresAt.toISOString(),
			shareText: t("familyLink.shareText", { name, url }),
		};
	});
