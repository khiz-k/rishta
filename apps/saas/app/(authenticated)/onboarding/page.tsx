import { getOrganizationList, getSession } from "@auth/lib/server";
import { OnboardingForm } from "@onboarding/components/OnboardingForm";
import { AuthWrapper } from "@shared/components/AuthWrapper";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	const t = await getTranslations("onboarding");

	return {
		title: t("title"),
	};
}

/**
 * Onboarding: the name step, then "Who is this page for?". It runs until the person has both a
 * name and a household.
 */
export default async function OnboardingPage() {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	const organizations = await getOrganizationList();
	const hasHousehold = organizations.length > 0;

	if (session.user.onboardingComplete && hasHousehold) {
		redirect("/");
	}

	return (
		<AuthWrapper contentClass="max-w-xl">
			<OnboardingForm hasHousehold={hasHousehold} />
		</AuthWrapper>
	);
}
