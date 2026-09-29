"use client";

import { useHousehold } from "@household/components/HouseholdProvider";
import type { FieldVisibility, VisibleField } from "@repo/database/drizzle/domain";
import type { ApiInputs, MyPage } from "@shared/lib/api-types";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type { FieldDef } from "./editor-fields";

export type FieldValue = string | number | boolean | string[] | null;

/**
 * In-place edits (design.md §5.7): Enter or blur saves optimistically through `profiles.patch`,
 * one section at a time; a failed save puts the old value back and the field stays open.
 */
export function usePagePatch() {
	const { organizationId } = useHousehold();
	const queryClient = useQueryClient();
	const key = orpc.profiles.me.queryKey({ input: { organizationId } });
	const patch = useMutation(orpc.profiles.patch.mutationOptions());
	const visibility = useMutation(orpc.profiles.setVisibility.mutationOptions());

	const save = useCallback(
		async (def: FieldDef, value: FieldValue) => {
			const previous = queryClient.getQueryData<MyPage>(key);
			if (previous) {
				queryClient.setQueryData<MyPage>(key, {
					...previous,
					page: { ...previous.page, [def.key]: value },
				});
			}
			try {
				// Each section validates its own fields on the server (a discriminated union).
				const input = {
					organizationId,
					section: def.section,
					values: { [def.key]: value },
				} as unknown as ApiInputs["profiles"]["patch"];
				const result = await patch.mutateAsync(input);
				queryClient.setQueryData<MyPage>(key, result);
				void queryClient.invalidateQueries({ queryKey: orpc.households.get.key() });
			} catch (error) {
				if (previous) {
					queryClient.setQueryData<MyPage>(key, previous);
				}
				throw error;
			}
		},
		[organizationId, patch, queryClient, key],
	);

	const setVisibility = useCallback(
		async (field: VisibleField, next: FieldVisibility) => {
			const previous = queryClient.getQueryData<MyPage>(key);
			if (previous) {
				queryClient.setQueryData<MyPage>(key, {
					...previous,
					page: {
						...previous.page,
						fieldVisibility: { ...previous.page.fieldVisibility, [field]: next },
					},
				});
			}
			try {
				await visibility.mutateAsync({ organizationId, field, visibility: next });
				void queryClient.invalidateQueries({ queryKey: key });
			} catch (error) {
				if (previous) {
					queryClient.setQueryData<MyPage>(key, previous);
				}
				throw error;
			}
		},
		[organizationId, visibility, queryClient, key],
	);

	return { save, setVisibility };
}
