import { ClaimPage } from "@household/components/ClaimPage";
import { PaperSlip } from "@shared/components/PaperSlip";
import { serverClaim } from "@shared/lib/api-server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function generateMetadata() {
	const t = await getTranslations("claim");
	return { title: t("metaTitle") };
}

/** Claim your page: for the invited candidate only; everyone else is told kindly why not. */
export default async function ClaimRoute({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations("claim");
	const { data: claim, code } = await serverClaim(organizationSlug);

	if (!claim) {
		const message =
			code === "EMAIL_NOT_VERIFIED"
				? t("states.verify")
				: code === "ALREADY_CLAIMED"
					? t("states.claimed")
					: code === "CLAIM_NOT_FOR_YOU"
						? t("states.notYou")
						: t("states.expired");
		return (
			<div className="px-4 md:px-6 pt-6 md:pt-14 mx-auto max-w-(--page-width)">
				<PaperSlip
					title={message}
					actions={
						<Link
							href={`/${organizationSlug}`}
							className="text-ui text-seal-ink underline-offset-4 hover:underline"
						>
							{t("states.back")}
						</Link>
					}
				/>
			</div>
		);
	}

	return <ClaimPage claim={claim} slug={organizationSlug} />;
}
