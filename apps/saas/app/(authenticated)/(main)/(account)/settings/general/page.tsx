import { getSession } from "@auth/lib/server";
import { AppearanceForm } from "@settings/components/AppearanceForm";
import { ChangeEmailForm } from "@settings/components/ChangeEmailForm";
import { ChangeNameForm } from "@settings/components/ChangeNameForm";
import { DeleteAccountForm } from "@settings/components/DeleteAccountForm";
import { PaperSlip } from "@shared/components/PaperSlip";
import { SettingsList } from "@shared/components/SettingsList";
import { SettingsPage } from "@shared/components/shell/SettingsNav";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("settings.account");

	return {
		title: t("title"),
	};
}

export default async function AccountSettingsPage({
	searchParams,
}: {
	searchParams: Promise<{ deleted?: string }>;
}) {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	const [t, { deleted }] = await Promise.all([getTranslations("settings.account"), searchParams]);

	return (
		<SettingsPage title={t("title")} lead={t("subtitle")}>
			{deleted === "household" && <PaperSlip role="status" title={t("householdDeleted")} />}
			<SettingsList>
				<ChangeNameForm />
				<ChangeEmailForm />
				<AppearanceForm />
				<DeleteAccountForm />
			</SettingsList>
		</SettingsPage>
	);
}
