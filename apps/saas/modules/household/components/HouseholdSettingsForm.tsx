"use client";

import { PAGE_LANGUAGES, type PageLanguage } from "@repo/database/drizzle/domain";
import { FAMILY_LANGUAGE_NAMES } from "@repo/i18n/lib/family-languages";
import { Button, Checkbox, cn } from "@repo/ui";
import { SettingsBlock } from "@shared/components/shell/SettingsNav";
import { useErrorText } from "@shared/hooks/use-error-text";
import { formatTime, zonePlace } from "@shared/lib/format";
import { orpc } from "@shared/lib/orpc-query-utils";
import { onRovingKeyDown, rovingTabIndex } from "@shared/lib/roving";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import { useHousehold } from "./HouseholdProvider";

interface Values {
	timeZone: string;
	folioReleaseHour: number;
	familyLanguage: PageLanguage;
	readIncognito: boolean;
	familyLinksAllowed: boolean;
	discreetEmails: boolean;
	keyboardShortcuts: boolean;
}

const HOURS = [17, 18, 19, 20, 21, 22];

/**
 * Household settings (design.md §3.3): time zone, folio hour, family language, private reading,
 * family links, discreet email subjects and single-key shortcuts. The candidate changes them;
 * everyone else reads them.
 */
export function HouseholdSettingsForm() {
	const t = useTranslations("household.settings");
	const errorText = useErrorText();
	const locale = useLocale();
	const queryClient = useQueryClient();
	const { household, organizationId, abilities, candidateFirstName } = useHousehold();
	const update = useMutation(orpc.households.updateSettings.mutationOptions());
	const canManage = abilities.canManage;

	const zones = useMemo(() => {
		try {
			return Intl.supportedValuesOf("timeZone");
		} catch {
			return [household.page?.timeZone ?? "UTC"];
		}
	}, [household.page?.timeZone]);

	const form = useForm<Values>({
		defaultValues: {
			timeZone: household.page?.timeZone ?? "America/New_York",
			folioReleaseHour: household.settings.folioReleaseHour,
			familyLanguage: household.settings.familyLanguage,
			readIncognito: household.settings.readIncognito,
			familyLinksAllowed: household.settings.familyLinksAllowed,
			discreetEmails: household.settings.discreetEmails,
			keyboardShortcuts: household.settings.keyboardShortcuts,
		},
	});

	const onSubmit = form.handleSubmit(async (values) => {
		await update.mutateAsync({ organizationId, ...values });
		form.reset(values);
		void queryClient.invalidateQueries({ queryKey: orpc.households.get.key() });
	});

	const hourLabel = (hour: number) => {
		const date = new Date();
		date.setHours(hour, 0, 0, 0);
		return formatTime(date, locale);
	};

	const check = (
		name: "readIncognito" | "familyLinksAllowed" | "discreetEmails" | "keyboardShortcuts",
	) => (
		<Controller
			control={form.control}
			name={name}
			render={({ field }) => (
				<label
					htmlFor={`setting-${name}`}
					className={cn(
						"gap-3 py-2 flex items-start",
						canManage ? "cursor-pointer" : "cursor-default",
					)}
				>
					<Checkbox
						id={`setting-${name}`}
						checked={field.value}
						disabled={!canManage}
						onCheckedChange={(checked) => field.onChange(checked === true)}
						className="mt-1"
					/>
					<span>
						<span className="block text-body">{t(`${name}.label`)}</span>
						<span className="block text-meta text-muted-foreground">
							{t(`${name}.help`)}
						</span>
					</span>
				</label>
			)}
		/>
	);

	return (
		<form onSubmit={onSubmit} className="gap-6 flex flex-col" noValidate>
			{!canManage && (
				<p className="text-body text-muted-foreground">
					{t("readOnly", { name: candidateFirstName })}
				</p>
			)}
			<SettingsBlock title={t("evening.title")} description={t("evening.description")}>
				<div className="gap-4 md:grid-cols-2 grid">
					<label className="gap-1.5 flex flex-col">
						<span className="label-caps text-muted-foreground">
							{t("evening.timeZone")}
						</span>
						<select
							{...form.register("timeZone")}
							disabled={!canManage}
							className="h-11 px-3 border border-input bg-card text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
						>
							{zones.map((zone) => (
								<option key={zone} value={zone}>
									{zonePlace(zone)} ({zone})
								</option>
							))}
						</select>
					</label>
					<label className="gap-1.5 flex flex-col">
						<span className="label-caps text-muted-foreground">
							{t("evening.hour")}
						</span>
						<select
							{...form.register("folioReleaseHour", { valueAsNumber: true })}
							disabled={!canManage}
							className="h-11 px-3 border border-input bg-card text-body tabular focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
						>
							{HOURS.map((hour) => (
								<option key={hour} value={hour}>
									{hourLabel(hour)}
								</option>
							))}
						</select>
					</label>
				</div>
			</SettingsBlock>

			<SettingsBlock title={t("family.title")} description={t("family.description")}>
				<Controller
					control={form.control}
					name="familyLanguage"
					render={({ field }) => (
						<div
							role="radiogroup"
							aria-label={t("family.language")}
							onKeyDown={(event) => onRovingKeyDown(event)}
							className="gap-2 sm:grid-cols-4 grid grid-cols-2"
						>
							{PAGE_LANGUAGES.map((code, index) => (
								<button
									key={code}
									type="button"
									role="radio"
									lang={code}
									aria-checked={field.value === code}
									tabIndex={rovingTabIndex(
										field.value === code,
										index,
										PAGE_LANGUAGES.some((item) => item === field.value),
									)}
									disabled={!canManage}
									onClick={() => field.onChange(code)}
									className={cn(
										"min-h-11 px-2 border text-ui focus-visible:outline-2 focus-visible:outline-ring",
										field.value === code
											? "border-2 border-foreground"
											: "border-border text-muted-foreground",
									)}
								>
									{FAMILY_LANGUAGE_NAMES[code]}
								</button>
							))}
						</div>
					)}
				/>
				<div className="mt-4">{check("familyLinksAllowed")}</div>
			</SettingsBlock>

			<SettingsBlock title={t("privacy.title")}>
				{check("readIncognito")}
				{check("discreetEmails")}
				{check("keyboardShortcuts")}
			</SettingsBlock>

			{canManage && (
				<div className="gap-4 flex items-center">
					<Button
						type="submit"
						variant="secondary"
						loading={form.formState.isSubmitting}
						disabled={!form.formState.isDirty}
					>
						{t("save")}
					</Button>
					{update.isSuccess && !form.formState.isDirty && (
						<span className="pencil text-meta">{t("saved")}</span>
					)}
					{update.error && (
						<span className="text-meta text-destructive">
							{errorText(update.error)}
						</span>
					)}
				</div>
			)}
		</form>
	);
}
