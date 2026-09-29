import "server-only";
import { openFamilyLink } from "@repo/api/modules/family-links/procedures/open-link";
import { getKept } from "@repo/api/modules/folio/procedures/get-kept";
import { getToday } from "@repo/api/modules/folio/procedures/get-today";
import { closePreview } from "@repo/api/modules/households/procedures/close-preview";
import { getClaim } from "@repo/api/modules/households/procedures/get-claim";
import { getHousehold } from "@repo/api/modules/households/procedures/get-household";
import { listMyHouseholds } from "@repo/api/modules/households/procedures/list-my-households";
import { getLetter } from "@repo/api/modules/interests/procedures/get-letter";
import { listLetters } from "@repo/api/modules/interests/procedures/list-letters";
import { getPreferences } from "@repo/api/modules/preferences/procedures/get-preferences";
import { getMyPage } from "@repo/api/modules/profiles/procedures/get-my-page";
import { getPage } from "@repo/api/modules/profiles/procedures/get-page";
import type { PageLanguage } from "@repo/database/drizzle/domain";
import { logger } from "@repo/logs";
import { headers } from "next/headers";
import { cache } from "react";

import { errorCode, type ErrorCode } from "./errors";

/**
 * Server Components read data through the same oRPC procedures the client uses (so every
 * membership, role and redaction rule applies), called in-process with the request headers.
 */
async function context() {
	return { context: { headers: await headers() } };
}

export interface ServerResult<T> {
	data: T | null;
	code: ErrorCode | null;
}

async function settle<T>(label: string, run: () => Promise<T>): Promise<ServerResult<T>> {
	try {
		return { data: await run(), code: null };
	} catch (error) {
		const code = errorCode(error);
		if (!code) {
			logger.error(error, { ctx: label });
		}
		return { data: null, code };
	}
}

export const serverHousehold = cache(async (organizationSlug: string) =>
	settle("households.get", async () =>
		getHousehold.callable(await context())({ organizationSlug }),
	),
);

export const serverMyHouseholds = cache(async () => {
	const result = await settle("households.listMine", async () =>
		listMyHouseholds.callable(await context())(),
	);
	return result.data ?? [];
});

export const serverFolioToday = cache(async (organizationId: string) =>
	settle("folio.today", async () => getToday.callable(await context())({ organizationId })),
);

export const serverKept = cache(async (organizationId: string) =>
	settle("folio.kept", async () => getKept.callable(await context())({ organizationId })),
);

export const serverMyPage = cache(async (organizationId: string) =>
	settle("profiles.me", async () => getMyPage.callable(await context())({ organizationId })),
);

export const serverPreferences = cache(async (organizationId: string) =>
	settle("preferences.get", async () =>
		getPreferences.callable(await context())({ organizationId }),
	),
);

export const serverPage = cache(async (organizationId: string, handle: string) =>
	settle("profiles.getPage", async () =>
		getPage.callable(await context())({ organizationId, handle }),
	),
);

export const serverLetter = cache(async (letterId: string) =>
	settle("interests.get", async () => getLetter.callable(await context())({ letterId })),
);

export const serverClaim = cache(async (organizationSlug: string) =>
	settle("households.getClaim", async () =>
		getClaim.callable(await context())({ organizationSlug }),
	),
);

export const serverClosePreview = cache(async (organizationId: string) =>
	settle("households.closePreview", async () =>
		closePreview.callable(await context())({ organizationId }),
	),
);

export const serverFamilyLink = cache(async (token: string, language?: PageLanguage) =>
	settle("familyLinks.open", async () =>
		openFamilyLink.callable(await context())({ token, language }),
	),
);

export const serverLetters = cache(
	async (organizationId: string, box: "waiting" | "introductions" | "sent" | "closed") =>
		settle("interests.list", async () =>
			listLetters.callable(await context())({ organizationId, box }),
		),
);
