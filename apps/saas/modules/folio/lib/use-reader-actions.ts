"use client";

import { useHousehold } from "@household/components/HouseholdProvider";
import type { PassReason } from "@repo/database/drizzle/domain";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type { ReaderItem } from "./reader";

/**
 * Keep, pass, undo and take back. Keep never turns the page; pass turns it and leaves an undo
 * slip. Every answer is written through the folio procedures, then the reader refetches.
 */
export function useReaderActions() {
	const { organizationId } = useHousehold();
	const queryClient = useQueryClient();
	const mark = useMutation(orpc.folio.mark.mutationOptions());
	const toggle = useMutation(orpc.shortlists.toggle.mutationOptions());
	const withdraw = useMutation(orpc.interests.withdraw.mutationOptions());

	/** Refetches the reader's data and resolves once the fresh pages have arrived. */
	const refresh = useCallback(async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: orpc.folio.key() }),
			queryClient.invalidateQueries({ queryKey: orpc.profiles.getPage.key() }),
		]);
	}, [queryClient]);

	const setKept = useCallback(
		async (item: ReaderItem, kept: boolean) => {
			if (item.folioPageId) {
				await mark.mutateAsync({
					folioPageId: item.folioPageId,
					state: kept ? "kept" : "unread",
				});
			} else if (item.page) {
				await toggle.mutateAsync({ organizationId, handle: item.page.handle });
			}
			await refresh();
		},
		[mark, toggle, organizationId, refresh],
	);

	const pass = useCallback(
		async (item: ReaderItem, passReason?: PassReason) => {
			if (!item.folioPageId) {
				return;
			}
			await mark.mutateAsync({ folioPageId: item.folioPageId, state: "passed", passReason });
			await refresh();
		},
		[mark, refresh],
	);

	const undoPass = useCallback(
		async (item: ReaderItem) => {
			if (!item.folioPageId) {
				return;
			}
			await mark.mutateAsync({ folioPageId: item.folioPageId, state: "unread" });
			await refresh();
		},
		[mark, refresh],
	);

	const markRead = useCallback(
		(item: ReaderItem) => {
			if (!item.folioPageId || item.state !== "unread" || !item.page) {
				return;
			}
			mark.mutate(
				{ folioPageId: item.folioPageId, state: "read" },
				{
					onSuccess: () => {
						void queryClient.invalidateQueries({ queryKey: orpc.folio.today.key() });
					},
				},
			);
		},
		[mark, queryClient],
	);

	const takeBack = useCallback(
		async (letterId: string) => {
			await withdraw.mutateAsync({ letterId });
			void queryClient.invalidateQueries({ queryKey: orpc.interests.key() });
			await refresh();
		},
		[withdraw, refresh, queryClient],
	);

	return { setKept, pass, undoPass, markRead, takeBack, refresh };
}
