import { CloseSearch } from "@household/components/CloseSearch";
import { PaperSlip } from "@shared/components/PaperSlip";
import { serverClosePreview, serverHousehold } from "@shared/lib/api-server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("close");
	return { title: t("title") };
}

/** Close my search: the candidate only. */
export default async function CloseRoute({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations("close");
	const { data: household } = await serverHousehold(organizationSlug);
	if (!household) {
		return notFound();
	}
	const { data: preview } = await serverClosePreview(household.id);
	if (!preview || !household.isCandidate) {
		return (
			<div className="px-4 md:px-6 pt-6 md:pt-14 mx-auto max-w-(--page-width)">
				<PaperSlip title={t("candidateOnly", { name: household.candidate.firstName })} />
			</div>
		);
	}
	if (household.page?.status === "closed") {
		return (
			<div className="px-4 md:px-6 pt-6 md:pt-14 mx-auto max-w-(--page-width)">
				<PaperSlip title={t("alreadyClosed")} />
			</div>
		);
	}
	return <CloseSearch preview={preview} />;
}
