import { WhoIsThisFor } from "@onboarding/components/WhoIsThisFor";
import { AuthWrapper } from "@shared/components/AuthWrapper";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
	const t = await getTranslations("onboarding.who");
	return { title: t("titleAnother") };
}

/** "Start a page for someone else": a mother helping a second child, or a sibling. */
export default function NewHouseholdPage() {
	return (
		<AuthWrapper contentClass="max-w-xl">
			<WhoIsThisFor mode="another" />
		</AuthWrapper>
	);
}
