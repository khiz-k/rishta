import { KeptScreen } from "@folio/components/KeptScreen";
import { serverHousehold, serverKept } from "@shared/lib/api-server";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("kept");
	return { title: t("title") };
}

/** Kept pages: the same reader over pages kept to read again and show family. */
export default async function KeptPagesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const { data: household } = await serverHousehold(organizationSlug);
	if (!household) {
		return notFound();
	}

	const queryClient = getServerQueryClient();
	const { data: kept } = await serverKept(household.id);
	if (kept) {
		queryClient.setQueryData(
			orpc.folio.kept.queryKey({ input: { organizationId: household.id } }),
			kept,
		);
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<KeptScreen />
		</HydrationBoundary>
	);
}
