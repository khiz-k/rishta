import {
	db,
	getFamilyLinkByTokenHash,
	getHouseholdSetting,
	getPageById,
	getPageByOrganizationId,
	isBlockedEitherWay,
	user as userTable,
} from "@repo/database";
import { eq } from "drizzle-orm";

import { firstNameOf } from "../../biodata/lib/page-view";
import { defaultHouseholdSettings, memberLabelFor } from "../../households/lib/context";
import { hashFamilyLinkToken } from "./token";

/**
 * Resolves a family link token and decides whether it is still open. Revocation is never
 * revealed: an expired, revoked or no-longer-shareable link simply reads "This link has closed."
 */
export async function resolveFamilyLink(token: string, now = new Date()) {
	if (token.length < 20 || token.length > 100) {
		return { state: "closed" as const, sharedBy: null };
	}
	const link = await getFamilyLinkByTokenHash(hashFamilyLinkToken(token));
	if (!link) {
		return { state: "closed" as const, sharedBy: null };
	}

	const [sharerPage, sharerSettings, creator, page] = await Promise.all([
		getPageByOrganizationId(link.organizationId),
		getHouseholdSetting(link.organizationId),
		db.query.user.findFirst({
			where: eq(userTable.id, link.createdByUserId),
			columns: { name: true },
		}),
		getPageById(link.profileId),
	]);
	const candidateFirstName = firstNameOf(sharerPage?.displayName ?? "");
	const settings = sharerSettings ?? {
		...defaultHouseholdSettings(link.organizationId),
		createdAt: null,
		updatedAt: null,
	};
	const sharedBy =
		sharerPage?.userId === link.createdByUserId
			? candidateFirstName
			: memberLabelFor(settings, link.createdByUserId, creator?.name);

	const ownPage = page?.organizationId === link.organizationId;
	const targetSettings = page && !ownPage ? await getHouseholdSetting(page.organizationId) : null;
	const blocked =
		page?.userId && sharerPage?.userId && !ownPage
			? await isBlockedEitherWay(sharerPage.userId, page.userId)
			: false;

	const closed =
		link.revokedAt !== null ||
		link.expiresAt.getTime() <= now.getTime() ||
		!page ||
		(!ownPage && page.status !== "active") ||
		blocked ||
		targetSettings?.familyLinksAllowed === false;

	if (closed || !page) {
		return { state: "closed" as const, sharedBy: candidateFirstName || null };
	}

	return { state: "open" as const, link, page, sharedBy, candidateFirstName };
}
