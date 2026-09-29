"use client";

import { useOptionalHousehold } from "@household/components/HouseholdProvider";
import { cn } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

/**
 * The number beside LETTERS: letters waiting for an answer plus introductions waiting on the
 * candidate's move. A plain tabular number in --seal-ink, never a bubble. Candidate only.
 */
export function useLettersCount() {
	const household = useOptionalHousehold();
	const enabled = Boolean(household?.abilities.isCandidate);
	const { data } = useQuery({
		...orpc.interests.counts.queryOptions({
			input: { organizationId: household?.organizationId ?? "" },
		}),
		enabled,
		refetchInterval: 60_000,
		refetchOnWindowFocus: true,
	});
	return enabled && data ? data.waiting + data.yourMove : 0;
}

export function LettersCount({ className }: { className?: string }) {
	const t = useTranslations("shell.nav");
	const count = useLettersCount();
	if (count === 0) {
		return null;
	}
	return (
		<span className={cn("text-seal-ink tabular", className)}>
			<span aria-hidden="true">{count}</span>
			<span className="sr-only">{t("lettersWaiting", { count })}</span>
		</span>
	);
}
