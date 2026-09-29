import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { useTranslations } from "next-intl";

export function OrganizationInvitationAlert({ className }: { className?: string }) {
	const t = useTranslations();
	return (
		<Alert variant="primary" className={className}>
			<AlertTitle>{t("organizations.invitationAlert.title")}</AlertTitle>
			<AlertDescription>{t("organizations.invitationAlert.description")}</AlertDescription>
		</Alert>
	);
}
