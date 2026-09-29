import { HouseholdMembers } from "@household/components/HouseholdMembers";
import { SettingsPage } from "@shared/components/shell/SettingsNav";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations("household.members");
	return { title: t("title") };
}

/** Household: members, relation labels, invitations and what the household can see. */
export default async function HouseholdMembersPage() {
	const t = await getTranslations("household.members");
	return (
		<SettingsPage title={t("title")} lead={t("lead")}>
			<HouseholdMembers />
		</SettingsPage>
	);
}
