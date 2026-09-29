"use client";

import { NOTIFICATION_GROUPS, type NotificationTypeId } from "@repo/notifications/catalog";
import { Button, Checkbox } from "@repo/ui";
import { RowsSkeleton } from "@shared/components/PaperSkeleton";
import { PaperSlip } from "@shared/components/PaperSlip";
import { SettingsItem } from "@shared/components/SettingsItem";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

/**
 * Email choices (design.md §4.1, §13): everything arrives in Letters, so the only question is
 * what also reaches you by email. One square checkbox per kind of message, grouped on paper; the
 * subjects stay discreet unless the household settings say otherwise.
 */
export function NotificationPreferencesForm() {
	const t = useTranslations("settings.notificationsPage");
	const tCommon = useTranslations("common");
	const queryClient = useQueryClient();
	const queryOptions = orpc.notifications.getPreferences.queryOptions({ input: {} });
	const query = useQuery(queryOptions);

	const disabledSet = useMemo(() => {
		const set = new Set<string>();
		for (const row of query.data?.disabled ?? []) {
			set.add(`${row.type}:${row.target}`);
		}
		return set;
	}, [query.data?.disabled]);

	const updateMutation = useMutation(
		orpc.notifications.updatePreference.mutationOptions({
			// The box ticks at once; a failure puts it back.
			onMutate: async ({ type, disabled }) => {
				await queryClient.cancelQueries({ queryKey: queryOptions.queryKey });
				const previous = queryClient.getQueryData(queryOptions.queryKey);
				queryClient.setQueryData(queryOptions.queryKey, (current) => {
					if (!current) {
						return current;
					}
					const rest = current.disabled.filter(
						(row) => !(row.type === type && row.target === "EMAIL"),
					);
					return {
						...current,
						disabled: disabled ? [...rest, { type, target: "EMAIL" as const }] : rest,
					};
				});
				return { previous };
			},
			onError: (_error, _variables, context) => {
				if (context?.previous) {
					queryClient.setQueryData(queryOptions.queryKey, context.previous);
				}
			},
			onSettled: () => queryClient.invalidateQueries({ queryKey: queryOptions.queryKey }),
		}),
	);

	const emailOn = (type: NotificationTypeId) => !disabledSet.has(`${type}:EMAIL`);

	return (
		<SettingsItem title={t("emailTitle")} description={t("emailLead")}>
			{query.isError ? (
				<PaperSlip
					role="alert"
					title={t("error")}
					actions={
						<Button variant="secondary" size="sm" onClick={() => void query.refetch()}>
							{tCommon("tryAgain")}
						</Button>
					}
				/>
			) : !query.data ? (
				<RowsSkeleton rows={5} />
			) : (
				<div className="gap-6 flex flex-col">
					{NOTIFICATION_GROUPS.map((group) => (
						<fieldset key={group.id}>
							<legend className="label-caps text-muted-foreground">
								{t(`groups.${group.id}.title`)}
							</legend>
							<div className="mt-1">
								{group.types.map((type) => (
									<label
										key={type}
										className="gap-3 min-h-11 flex cursor-pointer items-center border-b border-border last:border-b-0"
									>
										<Checkbox
											checked={emailOn(type)}
											onCheckedChange={(checked) =>
												updateMutation.mutate({
													type,
													target: "EMAIL",
													disabled: checked !== true,
												})
											}
										/>
										<span className="text-body">
											{t(`types.${type}.label`)}
										</span>
									</label>
								))}
							</div>
						</fieldset>
					))}
					{updateMutation.isError && (
						<p role="alert" className="text-meta text-destructive">
							{tCommon("notSaved")}
						</p>
					)}
				</div>
			)}
		</SettingsItem>
	);
}
