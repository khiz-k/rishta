import { getSession } from "@auth/lib/server";
import { FolioScreen } from "@folio/components/FolioScreen";
import { householdGate } from "@household/lib/server";
import { serverFolioToday, serverHousehold } from "@shared/lib/api-server";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("folio");
	return { title: t("titleFallback") };
}

/**
 * The Folio: the paradigm's home. The household gate runs here first (claim, the first page,
 * publish), then today's pages are read on the server so the first page arrives with the HTML.
 */
export default async function FolioPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const [session, { data: household }] = await Promise.all([
		getSession(),
		serverHousehold(organizationSlug),
	]);
	if (!session || !household) {
		return notFound();
	}

	const gate = householdGate(household, session.user.email);
	if (gate) {
		redirect(gate);
	}

	const queryClient = getServerQueryClient();
	const { data: folio } = await serverFolioToday(household.id);
	if (folio) {
		queryClient.setQueryData(
			orpc.folio.today.queryKey({ input: { organizationId: household.id } }),
			folio,
		);
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<FolioScreen />
		</HydrationBoundary>
	);
}
