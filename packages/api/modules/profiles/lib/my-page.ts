import {
	countReadersSince,
	getBlockedUserIdsEitherWay,
	getPageByOrganizationId,
	getPreferenceByOrganizationId,
} from "@repo/database";

import { DAY_MS } from "../../../lib/time";
import { toPageView, type PageWithPhotos } from "../../biodata/lib/page-view";
import { toOwnerPhotos } from "../../biodata/lib/photos";
import { canEditPage, type HouseholdContext } from "../../households/lib/context";
import { getCompleteness, missingRequiredFields } from "./completeness";

/** The household's own page with its margin data (completeness, readers, publish checklist). */
export async function buildMyPage(context: HouseholdContext, pageOverride?: PageWithPhotos) {
	const page = pageOverride ?? (await getPageByOrganizationId(context.organizationId));
	if (!page) {
		return null;
	}

	const [preference, readersThisWeek] = await Promise.all([
		getPreferenceByOrganizationId(context.organizationId),
		context.isCandidate && page.userId
			? getBlockedUserIdsEitherWay(page.userId).then((blocked) =>
					countReadersSince({
						profileUserId: page.userId ?? "",
						since: new Date(Date.now() - 7 * DAY_MS),
						excludeUserIds: Array.from(blocked),
					}),
				)
			: Promise.resolve(null),
	]);

	const missing = missingRequiredFields(page);
	if (!preference?.completedAt) {
		missing.push("lookingFor");
	}

	const {
		isActive: _isActive,
		isVerified: _isVerified,
		profilePhoto: _profilePhoto,
		photos,
		...rest
	} = page;

	return {
		page: rest,
		photos: await toOwnerPhotos(photos),
		completeness: getCompleteness(page, preference ?? null),
		missingForPublish: missing,
		canEdit: canEditPage(context),
		readersThisWeek,
		view: await toPageView(page, context.isCandidate ? "self" : "household"),
	};
}
