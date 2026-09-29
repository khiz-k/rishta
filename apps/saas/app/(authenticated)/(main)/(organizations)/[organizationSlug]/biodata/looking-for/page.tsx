import { LookingForPage } from "@biodata/components/looking-for/LookingForPage";
import { serverHousehold, serverMyPage, serverPreferences } from "@shared/lib/api-server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("lookingFor");
	return { title: t("title") };
}

/** Looking for: the non-negotiables as one editable page. */
export default async function LookingForRoute({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const { data: household } = await serverHousehold(organizationSlug);
	if (!household) {
		return notFound();
	}
	const [{ data: preference }, { data: myPage }] = await Promise.all([
		serverPreferences(household.id),
		serverMyPage(household.id),
	]);
	// "I'd like to meet" defaults to the opposite of the page's gender, and is never assumed elsewhere.
	const fallbackSeeking = myPage?.page.gender === "female" ? "male" : "female";

	return <LookingForPage preference={preference ?? null} fallbackSeeking={fallbackSeeking} />;
}
