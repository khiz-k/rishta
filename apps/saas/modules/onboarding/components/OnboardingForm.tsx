"use client";

import { useSession } from "@auth/hooks/use-session";
import { authClient } from "@repo/auth/client";
import { useRouter } from "@shared/hooks/router";
import { clearCache } from "@shared/lib/cache";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { withQuery } from "ufo";

import { OnboardingAccountStep } from "./OnboardingAccountStep";
import { WhoIsThisFor } from "./WhoIsThisFor";

/**
 * Onboarding: your name, then "Who is this page for?". Someone who joined through a family
 * invitation already has a household and goes straight in.
 */
export function OnboardingForm({ hasHousehold }: { hasHousehold: boolean }) {
	const t = useTranslations("onboarding");
	const router = useRouter();
	const { reloadSession } = useSession();
	const searchParams = useSearchParams();
	const stepSearchParam = searchParams.get("step");
	const redirectTo = searchParams.get("redirectTo");
	const step = stepSearchParam === "2" ? 2 : 1;

	const onAccountDone = async () => {
		// The name signs the page ("Me" becomes Priya), so the session must carry it first.
		await reloadSession().catch(() => undefined);
		if (hasHousehold) {
			await authClient.updateUser({ onboardingComplete: true });
			await clearCache();
			router.replace(redirectTo ?? "/");
			return;
		}
		router.replace(withQuery(window.location.pathname, { step: 2 }));
	};

	return (
		<div>
			<p className="label-caps text-muted-foreground">
				{t("step", { step, total: hasHousehold ? 1 : 2 })}
			</p>
			{step === 1 ? (
				<div className="mt-3">
					<h1 className="font-display text-title">{t("title")}</h1>
					<p className="mt-2 mb-6 text-body text-muted-foreground">{t("message")}</p>
					<OnboardingAccountStep onCompleted={() => void onAccountDone()} />
				</div>
			) : (
				<div className="mt-3">
					<WhoIsThisFor mode="onboarding" completeOnboarding />
				</div>
			)}
		</div>
	);
}
