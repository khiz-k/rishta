"use client";

import {
	DIETS,
	EDUCATION_LEVELS,
	type FitKey,
	GENDERS,
	MARITAL_STATUSES,
	RELIGIONS,
	RELOCATIONS,
	RESIDENCY_REQUIREMENTS,
	TIMELINES,
} from "@repo/database/drizzle/domain";
import { onRovingKeyDown, rovingTabIndex } from "@shared/lib/roving";
import { useTranslations } from "next-intl";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import type { LookingForValues } from "../../lib/looking-for";
import {
	ChipSelect,
	DealbreakerToggle,
	FreeChips,
	OptionRows,
	Question,
	Stepper,
	ValuesBudget,
} from "./controls";

/** Dealbreaker · Nice to have for one fit key, read and written through the form. */
function DealbreakerFor({ fitKey, label }: { fitKey: FitKey; label: string }) {
	const { control, setValue, getValues } = useFormContext<LookingForValues>();
	const dealbreakers = useWatch({ control, name: "dealbreakers" });
	return (
		<div className="mt-3">
			<DealbreakerToggle
				label={label}
				value={dealbreakers.includes(fitKey)}
				onChange={(on) => {
					const current = getValues("dealbreakers");
					setValue(
						"dealbreakers",
						on
							? Array.from(new Set([...current, fitKey]))
							: current.filter((key) => key !== fitKey),
						{ shouldDirty: true },
					);
				}}
			/>
		</div>
	);
}

export function TimelineQuestion({ withDealbreaker }: { withDealbreaker?: boolean }) {
	const t = useTranslations("lookingFor");
	const { control } = useFormContext<LookingForValues>();
	return (
		<>
			<Question title={t("timeline.question")}>
				<Controller
					control={control}
					name="marriageTimeline"
					render={({ field }) => (
						<OptionRows
							options={TIMELINES}
							value={field.value}
							onChange={field.onChange}
							label={t("timeline.question")}
							labelFor={(value) => t(`timeline.options.${value}`)}
						/>
					)}
				/>
				{withDealbreaker && (
					<DealbreakerFor fitKey="timeline" label={t("timeline.question")} />
				)}
			</Question>
			<Question title={t("seeking.question")}>
				<Controller
					control={control}
					name="seeking"
					render={({ field }) => (
						<div
							role="radiogroup"
							aria-label={t("seeking.question")}
							onKeyDown={(event) => onRovingKeyDown(event)}
							className="gap-2 inline-grid grid-cols-2"
						>
							{GENDERS.map((gender, index) => (
								<button
									key={gender}
									type="button"
									role="radio"
									aria-checked={field.value === gender}
									tabIndex={rovingTabIndex(
										field.value === gender,
										index,
										GENDERS.some((item) => item === field.value),
									)}
									onClick={() => field.onChange(gender)}
									className={
										field.value === gender
											? "min-h-14 px-5 border-2 border-foreground bg-card text-body"
											: "min-h-14 px-5 border border-border bg-card text-body hover:bg-accent/60"
									}
								>
									{t(`seeking.options.${gender}`)}
								</button>
							))}
						</div>
					)}
				/>
			</Question>
		</>
	);
}

export function WhereQuestion({ withDealbreaker }: { withDealbreaker?: boolean }) {
	const t = useTranslations("lookingFor");
	const { control } = useFormContext<LookingForValues>();
	return (
		<>
			<Question title={t("where.relocation")}>
				<Controller
					control={control}
					name="relocation"
					render={({ field }) => (
						<OptionRows
							options={RELOCATIONS}
							value={field.value}
							onChange={field.onChange}
							label={t("where.relocation")}
							labelFor={(value) => t(`where.relocationOptions.${value}`)}
						/>
					)}
				/>
				{withDealbreaker && (
					<DealbreakerFor fitKey="location" label={t("where.relocation")} />
				)}
			</Question>
			<Question title={t("where.residency")} hint={t("where.residencyHint")}>
				<Controller
					control={control}
					name="residencyRequirement"
					render={({ field }) => (
						<OptionRows
							options={RESIDENCY_REQUIREMENTS}
							value={field.value}
							onChange={field.onChange}
							label={t("where.residency")}
							labelFor={(value) => t(`where.residencyOptions.${value}`)}
						/>
					)}
				/>
				{withDealbreaker && (
					<DealbreakerFor fitKey="residency" label={t("where.residency")} />
				)}
			</Question>
			<Question title={t("where.places")} hint={t("where.placesHint")}>
				<Controller
					control={control}
					name="locations"
					render={({ field }) => (
						<FreeChips
							value={field.value}
							onChange={field.onChange}
							label={t("where.places")}
							placeholder={t("where.placesPlaceholder")}
						/>
					)}
				/>
			</Question>
		</>
	);
}

export function AgeCommunityQuestion({ withDealbreaker }: { withDealbreaker?: boolean }) {
	const t = useTranslations("lookingFor");
	const tValues = useTranslations("page.values");
	const { control, setValue, getValues } = useFormContext<LookingForValues>();
	return (
		<>
			<Question title={t("age.question")}>
				<div className="gap-4 flex flex-wrap items-center">
					<Controller
						control={control}
						name="ageMin"
						render={({ field }) => (
							<Stepper
								label={t("age.youngest")}
								value={field.value}
								min={18}
								max={80}
								onChange={(next) => {
									field.onChange(next);
									if (next > getValues("ageMax")) {
										setValue("ageMax", next, { shouldDirty: true });
									}
								}}
							/>
						)}
					/>
					<span className="text-body text-muted-foreground">{t("age.to")}</span>
					<Controller
						control={control}
						name="ageMax"
						render={({ field }) => (
							<Stepper
								label={t("age.oldest")}
								value={field.value}
								min={18}
								max={80}
								onChange={(next) => {
									field.onChange(next);
									if (next < getValues("ageMin")) {
										setValue("ageMin", next, { shouldDirty: true });
									}
								}}
							/>
						)}
					/>
				</div>
				{withDealbreaker && <DealbreakerFor fitKey="age" label={t("age.question")} />}
			</Question>
			<Question title={t("marital.question")}>
				<Controller
					control={control}
					name="maritalStatus"
					render={({ field }) => (
						<ChipSelect
							options={MARITAL_STATUSES}
							value={field.value}
							onChange={field.onChange}
							label={t("marital.question")}
							labelFor={(value) => tValues(`maritalStatus.${value}`)}
						/>
					)}
				/>
				{withDealbreaker && (
					<DealbreakerFor fitKey="marital_status" label={t("marital.question")} />
				)}
			</Question>
			<Question title={t("community.question")} hint={t("community.hint")}>
				<Controller
					control={control}
					name="communities"
					render={({ field }) => (
						<FreeChips
							value={field.value}
							onChange={field.onChange}
							label={t("community.question")}
							placeholder={t("community.placeholder")}
						/>
					)}
				/>
				{withDealbreaker && (
					<DealbreakerFor fitKey="community" label={t("community.question")} />
				)}
			</Question>
			<Question title={t("education.question")}>
				<Controller
					control={control}
					name="educationLevels"
					render={({ field }) => (
						<ChipSelect
							options={EDUCATION_LEVELS}
							value={field.value}
							onChange={field.onChange}
							label={t("education.question")}
							labelFor={(value) => tValues(`education.${value}`)}
						/>
					)}
				/>
				{withDealbreaker && (
					<DealbreakerFor fitKey="education" label={t("education.question")} />
				)}
			</Question>
		</>
	);
}

export function FaithDietQuestion() {
	const t = useTranslations("lookingFor");
	const tValues = useTranslations("page.values");
	const { control } = useFormContext<LookingForValues>();
	return (
		<>
			<Question title={t("faith.question")} hint={t("faith.hint")}>
				<Controller
					control={control}
					name="religions"
					render={({ field }) => (
						<ChipSelect
							options={RELIGIONS}
							value={field.value}
							onChange={field.onChange}
							label={t("faith.question")}
							labelFor={(value) => tValues(`religion.${value}`)}
						/>
					)}
				/>
				<DealbreakerFor fitKey="religion" label={t("faith.question")} />
			</Question>
			<Question title={t("diet.question")}>
				<Controller
					control={control}
					name="diet"
					render={({ field }) => (
						<ChipSelect
							options={DIETS}
							value={field.value}
							onChange={field.onChange}
							label={t("diet.question")}
							labelFor={(value) => tValues(`diet.${value}`)}
						/>
					)}
				/>
				<DealbreakerFor fitKey="diet" label={t("diet.question")} />
			</Question>
		</>
	);
}

export function LanguagesQuestion() {
	const t = useTranslations("lookingFor");
	const { control } = useFormContext<LookingForValues>();
	return (
		<Question title={t("languages.question")} hint={t("languages.hint")}>
			<Controller
				control={control}
				name="languages"
				render={({ field }) => (
					<FreeChips
						value={field.value}
						onChange={field.onChange}
						label={t("languages.question")}
						placeholder={t("languages.placeholder")}
						max={8}
					/>
				)}
			/>
		</Question>
	);
}

export function ValuesQuestion() {
	const t = useTranslations("lookingFor");
	const { control } = useFormContext<LookingForValues>();
	return (
		<Question title={t("values.question")}>
			<Controller
				control={control}
				name="values"
				render={({ field }) => (
					<ValuesBudget value={field.value} onChange={field.onChange} />
				)}
			/>
		</Question>
	);
}
