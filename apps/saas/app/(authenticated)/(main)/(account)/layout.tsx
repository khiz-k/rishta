import { getActiveHouseholdSlug } from "@household/lib/server";
import { AppShell } from "@shared/components/shell/AppShell";
import { serverHousehold } from "@shared/lib/api-server";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

/**
 * Account settings and moderation live in the same shell as the household (design.md §4.1):
 * the masthead points at the active household, and the avatar tile holds everything else.
 */
export default async function AccountLayout({ children }: PropsWithChildren) {
	const slug = await getActiveHouseholdSlug();
	const household = slug ? (await serverHousehold(slug)).data : null;
	const queryClient = getServerQueryClient();
	if (household) {
		queryClient.setQueryData(
			orpc.households.get.queryKey({ input: { organizationSlug: household.slug } }),
			household,
		);
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<AppShell household={household}>{children}</AppShell>
		</HydrationBoundary>
	);
}
