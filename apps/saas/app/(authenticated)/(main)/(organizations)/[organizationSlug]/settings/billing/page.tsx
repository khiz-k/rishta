import { getActiveOrganization } from "@auth/lib/server";
import { CreditsAndPlan } from "@household/components/CreditsAndPlan";
import { listPurchases } from "@payments/lib/server";
import { SettingsPage } from "@shared/components/shell/SettingsNav";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("credits");
	return { title: t("title") };
}

/** Credits & plan: Free or Premium, credits and their ledger, and a $5 pack. */
export default async function CreditsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);
	if (!organization) {
		return notFound();
	}
	const queryClient = getServerQueryClient();
	await queryClient.prefetchQuery({
		queryKey: orpc.payments.listPurchases.queryKey({
			input: { organizationId: organization.id },
		}),
		queryFn: () => listPurchases(organization.id),
	});
	const t = await getTranslations("credits");

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<SettingsPage title={t("title")} lead={t("lead")}>
				<CreditsAndPlan />
			</SettingsPage>
		</HydrationBoundary>
	);
}
