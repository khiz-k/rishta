import { getActiveOrganization } from "@auth/lib/server";
import { activeOrganizationQueryKey } from "@organizations/lib/api";
import { listPurchases } from "@payments/lib/server";
import { config as paymentsConfig } from "@repo/payments/config";
import { AppShell } from "@shared/components/shell/AppShell";
import { serverHousehold } from "@shared/lib/api-server";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import type { PropsWithChildren } from "react";

/**
 * Every household screen sits in Rishta's own shell (design.md §4): the masthead (Folio ·
 * Letters · My Biodata) on desktop, the top line and text-only bottom bar on the phone. The
 * household (Better Auth organization) is loaded once here and handed to every screen.
 */
export default async function HouseholdLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{
		organizationSlug: string;
	}>;
}>) {
	const { organizationSlug } = await params;

	const [organization, { data: household }] = await Promise.all([
		getActiveOrganization(organizationSlug),
		serverHousehold(organizationSlug),
	]);

	if (!organization || !household) {
		return notFound();
	}

	const queryClient = getServerQueryClient();

	queryClient.setQueryData(activeOrganizationQueryKey({ slug: organizationSlug }), organization);
	queryClient.setQueryData(
		orpc.households.get.queryKey({ input: { organizationSlug } }),
		household,
	);

	if (paymentsConfig.billingAttachedTo === "organization") {
		await queryClient.prefetchQuery({
			queryKey: orpc.payments.listPurchases.queryKey({
				input: {
					organizationId: organization.id,
				},
			}),
			queryFn: () => listPurchases(organization.id),
		});
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<AppShell household={household}>{children}</AppShell>
		</HydrationBoundary>
	);
}
