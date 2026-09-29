import { HouseholdSettingsForm } from "@household/components/HouseholdSettingsForm";
import { SettingsPage } from "@shared/components/shell/SettingsNav";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations("household.settings");
	return { title: t("title") };
}

export default async function HouseholdSettingsPage() {
	const t = await getTranslations("household.settings");
	return (
		<SettingsPage title={t("title")} lead={t("lead")}>
			<HouseholdSettingsForm />
		</SettingsPage>
	);
}
