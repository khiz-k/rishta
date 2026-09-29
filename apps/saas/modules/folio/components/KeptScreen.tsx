"use client";

import { useHousehold } from "@household/components/HouseholdProvider";
import { Button } from "@repo/ui";
import { PaperSkeleton } from "@shared/components/PaperSkeleton";
import { PaperSlip } from "@shared/components/PaperSlip";
import { useShellContextLine } from "@shared/components/shell/ShellContext";
import { errorStatus } from "@shared/lib/errors";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo } from "react";

import { fromKeptPage } from "../lib/reader";
import { FolioReader } from "./FolioReader";

/**
 * Kept pages (design.md §5.10): the family table in this paradigm. The same reader over pages
 * kept to read again and discuss, newest first, with every pencil note beside each one.
 */
export function KeptScreen() {
	const t = useTranslations("kept");
	const { organizationId, slug, candidateFirstName } = useHousehold();
	const query = useQuery({
		...orpc.folio.kept.queryOptions({ input: { organizationId } }),
		refetchOnWindowFocus: true,
	});
	const items = useMemo(() => (query.data ?? []).map(fromKeptPage), [query.data]);

	useShellContextLine(items.length > 0 ? undefined : t("title"));

	if (!query.data) {
		if (query.isError) {
			const forbidden = errorStatus(query.error) === "FORBIDDEN";
			return (
				<div className="px-4 md:px-6 pt-6 md:pt-14 mx-auto max-w-(--page-width)">
					<PaperSlip
						role="alert"
						title={forbidden ? t("private", { name: candidateFirstName }) : t("error")}
						actions={
							forbidden ? null : (
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

	if (items.length === 0) {
		return (
			<div className="px-4 md:px-6 pt-6 md:pt-14 mx-auto max-w-(--page-width)">
				<PaperSlip
					title={t("empty")}
					actions={
						<Link
							href={`/${slug}`}
							className="text-ui text-seal-ink underline-offset-4 hover:underline"
						>
							{t("backToFolio")}
						</Link>
					}
				/>
			</div>
		);
	}

	return (
		<FolioReader
			items={items}
			mode="kept"
			title={t("title")}
			counterLabel={(position, total) => t("counter", { position, total })}
		/>
	);
}
