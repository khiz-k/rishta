"use client";

import { createPurchasesHelper } from "@repo/payments/lib/helper";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MAX_WAIT_MS = 20_000;
const POLL_INTERVAL_MS = 2_000;

/** Only same-site paths are followed after checkout. */
function safeNext(next: string | undefined) {
	return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/**
 * Back from checkout: waits quietly for the purchase to arrive (a subscription or a credit pack),
 * then returns to where the household started, usually Credits & plan.
 */
export function CheckoutReturnContent({
	organizationId,
	next,
}: {
	organizationId?: string;
	next?: string;
}) {
	const t = useTranslations("checkoutReturn");
	const router = useRouter();
	const [polling, setPolling] = useState(true);
	const initialCount = useRef<number | null>(null);
	const destination = safeNext(next);

	const { data } = useQuery({
		...orpc.payments.listPurchases.queryOptions({
			input: { organizationId },
		}),
		refetchInterval: polling ? POLL_INTERVAL_MS : false,
	});

	const purchases = data ?? [];
	const { activePlan } = createPurchasesHelper(purchases);
	if (data && initialCount.current === null) {
		initialCount.current = purchases.length;
	}
	const arrived =
		(activePlan && activePlan.id !== "free") ||
		(initialCount.current !== null && purchases.length > initialCount.current);

	useEffect(() => {
		if (arrived) {
			setPolling(false);
			router.replace(destination);
		}
	}, [arrived, router, destination]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setPolling(false);
			router.replace(destination);
		}, MAX_WAIT_MS);

		return () => clearTimeout(timer);
	}, [router, destination]);

	return (
		<div className="gap-4 py-8 flex flex-col items-center justify-center">
			<p role="status" className="text-center font-display text-letter">
				{t("loading")}
			</p>
		</div>
	);
}
