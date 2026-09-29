import { LetterView } from "@letters/components/LetterView";
import { serverLetter } from "@shared/lib/api-server";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations("letters");
	// Discreet: a tab title never names anyone.
	return { title: t("aLetter") };
}

export default async function LetterPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; letterId: string }>;
}) {
	const { letterId } = await params;
	const queryClient = getServerQueryClient();
	const { data } = await serverLetter(letterId);
	if (data) {
		queryClient.setQueryData(orpc.interests.get.queryKey({ input: { letterId } }), data);
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<LetterView letterId={letterId} />
		</HydrationBoundary>
	);
}
