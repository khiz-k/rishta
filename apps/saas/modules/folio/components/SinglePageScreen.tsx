"use client";

import { useHousehold } from "@household/components/HouseholdProvider";
import { Button } from "@repo/ui";
import { PaperSkeleton } from "@shared/components/PaperSkeleton";
import { PaperSlip } from "@shared/components/PaperSlip";
import { errorStatus } from "@shared/lib/errors";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";

import type { ReaderItem } from "../lib/reader";
import { FolioReader } from "./FolioReader";

/**
 * /b/[handle]: one page at its canonical, print-true address, with its margin (design.md §4.3).
 * The same reader, the same answers; access, blocks and veils are decided by the server.
 */
export function SinglePageScreen({ handle }: { handle: string }) {
	const t = useTranslations("single");
	const { organizationId, candidateFirstName } = useHousehold();
	const query = useQuery({
		...orpc.profiles.getPage.queryOptions({ input: { organizationId, handle } }),
		refetchOnWindowFocus: true,
	});
	const trackRead = useMutation(orpc.profiles.trackRead.mutationOptions());
	const tracked = useRef(false);

	useEffect(() => {
		if (
			query.data &&
			!tracked.current &&
			query.data.relationship !== "self" &&
			query.data.relationship !== "household"
		) {
			tracked.current = true;
			trackRead.mutate({ organizationId, handle });
		}
	}, [query.data, organizationId, handle]); // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps

	const items = useMemo<ReaderItem[]>(() => {
		const page = query.data;
		if (!page) {
			return [];
		}
		const { reasons, myLetter, theirLetter, kept, pencilNotes, familyLinksAllowed, ...view } =
			page;
		return [
			{
				key: page.handle,
				folioPageId: null,
				page: view,
				reasons,
				pencilNotes,
				kept,
				state: null,
				passReason: null,
				seenBefore: false,
				myLetter,
				theirLetterId: theirLetter?.letterId ?? null,
				keptBy: null,
				familyLinksAllowed,
			},
		];
	}, [query.data]);

	if (!query.data) {
		if (query.isError) {
			const status = errorStatus(query.error);
			const missing = status === "NOT_FOUND";
			// Guardians and family read other pages only while the candidate shares the folio.
			const forbidden = status === "FORBIDDEN";
			return (
				<div className="px-4 md:px-6 pt-6 md:pt-14 mx-auto max-w-(--page-width)">
					<PaperSlip
						role="alert"
						title={
							forbidden
								? t("private", { name: candidateFirstName })
								: missing
									? t("missing")
									: t("error")
						}
						actions={
							missing || forbidden ? null : (
								<Button variant="secondary" onClick={() => void query.refetch()}>
									{t("tryAgain")}
								</Button>
							)
						}
					/>
				</div>
			);
		}
		return (
			<div className="md:px-6 pt-3 md:pt-10">
				<PaperSkeleton />
			</div>
		);
	}

	return (
		<FolioReader
			items={items}
			mode="single"
			title={t("title")}
			counterLabel={() => query.data.ref}
		/>
	);
}
