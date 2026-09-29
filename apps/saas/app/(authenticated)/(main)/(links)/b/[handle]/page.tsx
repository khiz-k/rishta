import { SinglePageScreen } from "@folio/components/SinglePageScreen";
import { getActiveHouseholdSlug } from "@household/lib/server";
import { formatHandleRef, normalizeHandle } from "@repo/database/drizzle/domain";
import { LinkShell } from "@shared/components/shell/LinkShell";
import { serverHousehold, serverPage } from "@shared/lib/api-server";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("single");
	// Discreet: a tab title never names anyone.
	return { title: t("title"), robots: { index: false, follow: false } };
}

/** A single page at its canonical address, chrome-free, read by the active household. */
export default async function PageByHandle({ params }: { params: Promise<{ handle: string }> }) {
	const { handle: raw } = await params;
	const handle = normalizeHandle(raw);
	const slug = await getActiveHouseholdSlug();
	if (!slug) {
		redirect("/onboarding");
	}
	const { data: household } = await serverHousehold(slug);
	if (!household) {
		redirect("/");
	}

	const queryClient = getServerQueryClient();
	const { data: page } = await serverPage(household.id, handle);
	if (page) {
		queryClient.setQueryData(
			orpc.profiles.getPage.queryKey({ input: { organizationId: household.id, handle } }),
			page,
		);
		queryClient.setQueryData(
			orpc.households.get.queryKey({ input: { organizationSlug: slug } }),
			household,
		);
	}

	const t = await getTranslations("shell");
	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<LinkShell
				household={household}
				backHref={`/${slug}`}
				backLabel={t("backLabel")}
				reference={t("pageRef", { ref: formatHandleRef(handle) })}
			>
				<SinglePageScreen handle={handle} />
			</LinkShell>
		</HydrationBoundary>
	);
}
