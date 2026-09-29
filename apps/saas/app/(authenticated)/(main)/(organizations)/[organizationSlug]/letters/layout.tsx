import { LettersFrame } from "@letters/components/LettersFrame";
import { serverHousehold, serverLetters } from "@shared/lib/api-server";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import type { PropsWithChildren } from "react";

const BOXES = ["waiting", "introductions", "sent", "closed"] as const;

/** Letters: the list beside the open letter on desktop, one column on the phone. */
export default async function LettersLayout({
	children,
	params,
}: PropsWithChildren<{ params: Promise<{ organizationSlug: string }> }>) {
	const { organizationSlug } = await params;
	const { data: household } = await serverHousehold(organizationSlug);
	if (!household) {
		return notFound();
	}

	const queryClient = getServerQueryClient();
	if (household.isCandidate) {
		const results = await Promise.all(BOXES.map((box) => serverLetters(household.id, box)));
		BOXES.forEach((box, index) => {
			const data = results[index]?.data;
			if (data) {
				queryClient.setQueryData(
					orpc.interests.list.queryKey({ input: { organizationId: household.id, box } }),
					data,
				);
			}
		});
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<LettersFrame>{children}</LettersFrame>
		</HydrationBoundary>
	);
}
