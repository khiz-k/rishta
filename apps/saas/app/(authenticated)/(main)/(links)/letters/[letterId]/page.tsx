import { getActiveOrganization, getSession } from "@auth/lib/server";
import { LetterView } from "@letters/components/LetterView";
import { getLetterById, getOrganizationById } from "@repo/database";
import { LinkShell } from "@shared/components/shell/LinkShell";
import { serverHousehold, serverLetter } from "@shared/lib/api-server";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("letters");
	return { title: t("aLetter"), robots: { index: false, follow: false } };
}

/**
 * A letter opened from an email or a notification, chrome-free. It opens in the household the
 * letter belongs to; every access rule is checked by `interests.get`.
 */
export default async function LetterLinkPage({
	params,
}: {
	params: Promise<{ letterId: string }>;
}) {
	const [{ letterId }, session] = await Promise.all([params, getSession()]);
	if (!session) {
		return notFound();
	}
	const letter = await getLetterById(letterId);
	if (!letter || (letter.fromUserId !== session.user.id && letter.toUserId !== session.user.id)) {
		return notFound();
	}
	const organizationId =
		letter.fromUserId === session.user.id ? letter.fromOrganizationId : letter.toOrganizationId;
	const organization = await getOrganizationById(organizationId);
	if (!organization || !(await getActiveOrganization(organization.slug))) {
		return notFound();
	}
	const { data: household } = await serverHousehold(organization.slug);
	if (!household) {
		return notFound();
	}

	const queryClient = getServerQueryClient();
	const { data } = await serverLetter(letterId);
	if (data) {
		queryClient.setQueryData(orpc.interests.get.queryKey({ input: { letterId } }), data);
	}
	queryClient.setQueryData(
		orpc.households.get.queryKey({ input: { organizationSlug: household.slug } }),
		household,
	);

	const t = await getTranslations("shell");
	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<LinkShell
				household={household}
				backHref={`/${household.slug}/letters`}
				backLabel={t("backToLettersLabel")}
			>
				<div className="mx-auto max-w-[1440px]">
					<LetterView letterId={letterId} backHref={`/${household.slug}/letters`} />
				</div>
			</LinkShell>
		</HydrationBoundary>
	);
}
