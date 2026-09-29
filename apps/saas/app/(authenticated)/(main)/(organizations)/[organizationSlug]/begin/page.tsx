import { BeginFlow } from "@biodata/components/looking-for/BeginFlow";
import { serverHousehold, serverMyPage, serverPreferences } from "@shared/lib/api-server";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("begin");
	return { title: t("title") };
}

/** The first page: the timeline-first five steps, run once. */
export default async function BeginPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const { data: household } = await serverHousehold(organizationSlug);
	if (!household) {
		return notFound();
	}
	const mayDraft =
		household.role === "owner" || (household.role === "admin" && !household.candidate.userId);
	if (!mayDraft) {
		redirect(`/${organizationSlug}`);
	}

	const [{ data: preference }, { data: myPage }] = await Promise.all([
		serverPreferences(household.id),
		serverMyPage(household.id),
	]);
	const fallbackSeeking = myPage?.page.gender === "female" ? "male" : "female";

	return <BeginFlow preference={preference ?? null} fallbackSeeking={fallbackSeeking} />;
}
