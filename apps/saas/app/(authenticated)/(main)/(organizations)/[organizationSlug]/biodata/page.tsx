import { BiodataEditor } from "@biodata/components/BiodataEditor";
import { serverHousehold, serverMyPage } from "@shared/lib/api-server";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("biodata");
	return { title: t("title") };
}

/** My Biodata: the household's own page, read and edited in place. */
export default async function MyBiodataPage({
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
	const { data: myPage } = await serverMyPage(household.id);
	if (myPage) {
		queryClient.setQueryData(
			orpc.profiles.me.queryKey({ input: { organizationId: household.id } }),
			myPage,
		);
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<BiodataEditor />
		</HydrationBoundary>
	);
}
