"use client";

import { organizationListQueryKey } from "@organizations/lib/api";
import { authClient } from "@repo/auth/client";
import { Button } from "@repo/ui/components/button";
import { useRouter } from "@shared/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * "Join Priya's household", or, for the person a page was started for, "Your family has started
 * a page for you" (the candidate then confirms it on Claim your page).
 */
export function OrganizationInvitationModal({
	invitationId,
	organizationName,
	organizationSlug,
	forCandidate,
}: {
	invitationId: string;
	organizationName: string;
	organizationSlug: string;
	forCandidate?: boolean;
}) {
	const t = useTranslations("organizations.invitationModal");
	const router = useRouter();
	const queryClient = useQueryClient();
	const [submitting, setSubmitting] = useState<false | "accept" | "reject">(false);
	const [failed, setFailed] = useState(false);

	const onSelectAnswer = async (accept: boolean) => {
		setSubmitting(accept ? "accept" : "reject");
		setFailed(false);
		try {
			if (accept) {
				const { error } = await authClient.organization.acceptInvitation({ invitationId });
				if (error) {
					throw error;
				}
				await queryClient.invalidateQueries({ queryKey: organizationListQueryKey });
				await authClient.organization.setActive({ organizationSlug });
				router.replace(
					forCandidate ? `/${organizationSlug}/claim` : `/${organizationSlug}`,
				);
			} else {
				const { error } = await authClient.organization.rejectInvitation({ invitationId });
				if (error) {
					throw error;
				}
				router.replace("/");
			}
		} catch {
			setFailed(true);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div>
			<h1 className="font-display text-title-sm">
				{forCandidate ? t("candidateTitle") : t("title", { name: organizationName })}
			</h1>
			<p className="mt-2 mb-6 text-body text-muted-foreground">
				{forCandidate ? t("candidateDescription") : t("description", { organizationName })}
			</p>

			{failed && (
				<p role="alert" className="mb-4 text-body text-destructive">
					{t("failed")}
				</p>
			)}

			<div className="gap-2 sm:flex-row flex flex-col-reverse">
				<Button
					className="flex-1"
					variant="ghost"
					onClick={() => void onSelectAnswer(false)}
					disabled={!!submitting}
					loading={submitting === "reject"}
				>
					{t("decline")}
				</Button>
				<Button
					className="flex-1"
					variant="secondary"
					onClick={() => void onSelectAnswer(true)}
					disabled={!!submitting}
					loading={submitting === "accept"}
				>
					{forCandidate ? t("candidateAccept") : t("accept")}
				</Button>
			</div>
		</div>
	);
}
