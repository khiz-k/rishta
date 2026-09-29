import { getOrganizationList, getSession } from "@auth/lib/server";
import { listPurchases } from "@repo/api/modules/payments/procedures/list-purchases";
import { config as authConfig } from "@repo/auth/config";
import { config as paymentsConfig } from "@repo/payments/config";
import { createPurchasesHelper } from "@repo/payments/lib/helper";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

/**
 * The first gate (design.md §3.5): no name yet, or no household yet → onboarding ("Who is this
 * page for?"). The household's own gate (claim, the first page, publish) runs on the Folio.
 */
export default async function MainLayout({ children }: PropsWithChildren) {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	if (authConfig.users.enableOnboarding && !session.user.onboardingComplete) {
		redirect("/onboarding");
	}

	const organizations = await getOrganizationList();

	if (organizations.length === 0 && session.user.role !== "admin") {
		redirect("/onboarding?step=2");
	}

	if (paymentsConfig.requireActiveSubscription) {
		const organizationId = session?.session.activeOrganizationId || organizations?.at(0)?.id;

		const purchases = await listPurchases.callable({
			context: { headers: await headers() },
		})({
			organizationId,
		});

		const { activePlan } = createPurchasesHelper(purchases);

		if (!activePlan) {
			redirect("/choose-plan");
		}
	}

	return children;
}
