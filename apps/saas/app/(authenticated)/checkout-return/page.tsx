import { getSession } from "@auth/lib/server";
import { CheckoutReturnContent } from "@payments/components/CheckoutReturnContent";
import { AuthWrapper } from "@shared/components/AuthWrapper";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	const t = await getTranslations("checkoutReturn");

	return {
		title: t("title"),
	};
}

export default async function CheckoutReturnPage({
	searchParams,
}: {
	searchParams: Promise<{ organizationId?: string; next?: string }>;
}) {
	const [session, t, { organizationId, next }] = await Promise.all([
		getSession(),
		getTranslations("checkoutReturn"),
		searchParams,
	]);

	if (!session) {
		redirect("/login");
	}

	return (
		<AuthWrapper>
			<div className="mb-4 text-center">
				<h1 className="font-display text-title-sm">{t("title")}</h1>
				<p className="text-body text-muted-foreground">{t("description")}</p>
			</div>

			<CheckoutReturnContent organizationId={organizationId} next={next} />
		</AuthWrapper>
	);
}
