import { OrganizationInvitationModal } from "@organizations/components/OrganizationInvitationModal";
import { auth } from "@repo/auth";
import { getHouseholdSetting } from "@repo/database";
import { AuthWrapper } from "@shared/components/AuthWrapper";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function OrganizationInvitationPage({
	params,
}: {
	params: Promise<{ invitationId: string }>;
}) {
	const { invitationId } = await params;

	const invitation = await auth.api.getInvitation({
		query: {
			id: invitationId,
		},
		headers: await headers(),
	});

	if (!invitation) {
		redirect("/");
	}

	// An invitation to the person a relative started a page for is a claim, worded as one.
	const setting = await getHouseholdSetting(invitation.organizationId);
	const forCandidate =
		Boolean(setting?.pendingCandidateEmail) &&
		setting?.pendingCandidateEmail?.toLowerCase() === invitation.email.toLowerCase();

	return (
		<AuthWrapper>
			<OrganizationInvitationModal
				organizationName={invitation.organizationName}
				organizationSlug={invitation.organizationSlug}
				invitationId={invitationId}
				forCandidate={forCandidate}
			/>
		</AuthWrapper>
	);
}
