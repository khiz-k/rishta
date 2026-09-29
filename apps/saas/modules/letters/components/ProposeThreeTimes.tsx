"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Checkbox, cn } from "@repo/ui";
import type { CallProposalView, IntroductionView } from "@shared/lib/api-types";
import { knownErrorCode } from "@shared/lib/errors";
import { cityOf, formatFullDay, formatSlotDay, formatTime, zonePlace } from "@shared/lib/format";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { isEvening, isWithinHorizon, middayOf, timesOnDate, upcomingDates } from "../lib/slots";

interface Zones {
	you: { zone: string; place: string };
	them: { zone: string; place: string; name: string };
}

function useZones(introduction: IntroductionView): Zones {
	return {
		you: {
			zone: introduction.you.timeZone,
			place: cityOf(introduction.you.city) ?? zonePlace(introduction.you.timeZone),
		},
		them: {
			zone: introduction.them.timeZone,
			place:
				cityOf(introduction.them.page.header.city) ?? zonePlace(introduction.them.timeZone),
			name: introduction.them.firstName,
		},
	};
}

/** "Thu 2 Oct · 8:00 pm Edison · 7:00 pm Dallas", in tabular numbers. */
function SlotLabel({ slot, zones }: { slot: string; zones: Zones }) {
	const locale = useLocale();
	return (
		<span className="gap-x-3 flex flex-wrap items-baseline tabular">
			<span className="font-semibold min-w-[6.5rem] text-body [font-stretch:87.5%]">
				{formatSlotDay(slot, locale, zones.you.zone)}
			</span>
			<span className="text-body">
				{formatTime(slot, locale, zones.you.zone)} {zones.you.place}
				{zones.you.zone !== zones.them.zone && (
					<>
						<span className="text-muted-foreground"> · </span>
						{formatTime(slot, locale, zones.them.zone)} {zones.them.place}
					</>
				)}
			</span>
		</span>
	);
}

const tickSchema = z.object({ slots: z.array(z.number().int().min(0).max(2)) });

function OpenProposal({
	proposal,
	zones,
	introduction,
}: {
	proposal: CallProposalView;
	zones: Zones;
	introduction: IntroductionView;
}) {
	const t = useTranslations("intro.times");
	const queryClient = useQueryClient();
	const form = useForm<z.infer<typeof tickSchema>>({
		resolver: zodResolver(tickSchema),
		defaultValues: { slots: proposal.availabilityYou },
	});
	const ticked = useWatch({ control: form.control, name: "slots" });
	const setAvailability = useMutation(orpc.matches.setAvailability.mutationOptions());

	const onSubmit = form.handleSubmit(async ({ slots }) => {
		form.clearErrors("root");
		try {
			await setAvailability.mutateAsync({ proposalId: proposal.id, slotIndexes: slots });
			void queryClient.invalidateQueries({ queryKey: orpc.interests.get.key() });
			void queryClient.invalidateQueries({ queryKey: orpc.interests.list.key() });
			void queryClient.invalidateQueries({ queryKey: orpc.interests.counts.key() });
		} catch (error) {
			form.setError("root", {
				message: knownErrorCode(error) === "PROPOSAL_NOT_OPEN" ? t("notOpen") : t("failed"),
			});
		}
	});

	if (proposal.proposedBy === "you") {
		return (
			<div>
				<p className="text-body">{t("waitingForThem", { name: zones.them.name })}</p>
				<ul className="mt-3 border-t border-border">
					{proposal.slots.map((slot) => (
						<li key={slot} className="py-3 border-b border-border">
							<SlotLabel slot={slot} zones={zones} />
						</li>
					))}
				</ul>
			</div>
		);
	}

	const saved = proposal.availabilityYou.length > 0;

	return (
		<form onSubmit={onSubmit} noValidate>
			{proposal.proposedBy === "them" && (
				<p className="mb-3 text-body">{t("theyProposed", { name: zones.them.name })}</p>
			)}
			{proposal.note && <p className="mb-3 pencil text-body">“{proposal.note}”</p>}
			<Controller
				control={form.control}
				name="slots"
				render={({ field }) => (
					<ul className="border-t border-border">
						{proposal.slots.map((slot, index) => {
							const checked = field.value.includes(index);
							const theyTicked =
								proposal.proposedBy === "them" ||
								proposal.availabilityThem.includes(index);
							return (
								<li key={slot} className="border-b border-border">
									<label className="gap-4 py-3 flex cursor-pointer items-center">
										<Checkbox
											checked={checked}
											onCheckedChange={(next) =>
												field.onChange(
													next === true
														? [...field.value, index].sort(
																(a, b) => a - b,
															)
														: field.value.filter(
																(value) => value !== index,
															),
												)
											}
										/>
										<span className="min-w-0 flex-1">
											<SlotLabel slot={slot} zones={zones} />
											{theyTicked && proposal.proposedBy !== "them" && (
												<span className="block pencil text-meta">
													{t("theyTicked", { name: zones.them.name })}
												</span>
											)}
										</span>
									</label>
								</li>
							);
						})}
					</ul>
				)}
			/>
			{form.formState.errors.root && (
				<p role="alert" className="mt-3 text-body text-destructive">
					{form.formState.errors.root.message}
				</p>
			)}
			<div className="mt-4 gap-4 flex flex-wrap items-center">
				<Button
					type="submit"
					variant="secondary"
					disabled={ticked.length === 0 || introduction.stage === "closed"}
					loading={form.formState.isSubmitting}
				>
					{saved ? t("update") : t("theseWork")}
				</Button>
				{saved && !form.formState.isDirty && (
					<span className="text-meta text-muted-foreground">
						{t("saved", { name: zones.them.name })}
					</span>
				)}
			</div>
		</form>
	);
}

const MAX_SLOTS = 3;

/** Propose three others: a row of day cells and half-hour rows labelled in both time zones. */
function ProposeOthers({
	introduction,
	zones,
	onDone,
}: {
	introduction: IntroductionView;
	zones: Zones;
	onDone: () => void;
}) {
	const t = useTranslations("intro.times");
	const locale = useLocale();
	const queryClient = useQueryClient();
	const dates = useMemo(() => upcomingDates(zones.you.zone, 14), [zones.you.zone]);
	const form = useForm<{ day: string; slots: string[] }>({
		defaultValues: { day: dates[0] ?? "", slots: [] },
	});
	const day = useWatch({ control: form.control, name: "day" });
	const chosen = useWatch({ control: form.control, name: "slots" });
	const setDay = (value: string) => form.setValue("day", value);
	const [error, setError] = useState<string | null>(null);
	const propose = useMutation(orpc.matches.proposeCall.mutationOptions());
	const times = useMemo(
		() => (day ? timesOnDate(day, zones.you.zone).filter((time) => isWithinHorizon(time)) : []),
		[day, zones.you.zone],
	);

	const toggle = (iso: string) => {
		setError(null);
		const previous = form.getValues("slots");
		const next = previous.includes(iso)
			? previous.filter((value) => value !== iso)
			: previous.length >= MAX_SLOTS
				? previous
				: [...previous, iso].sort();
		form.setValue("slots", next, { shouldDirty: true });
	};

	const submit = async () => {
		if (chosen.length !== MAX_SLOTS) {
			return;
		}
		setError(null);
		try {
			await propose.mutateAsync({
				matchId: introduction.id,
				slots: [chosen[0] ?? "", chosen[1] ?? "", chosen[2] ?? ""],
			});
			void queryClient.invalidateQueries({ queryKey: orpc.interests.get.key() });
			onDone();
		} catch (failure) {
			setError(knownErrorCode(failure) === "INVALID_SLOTS" ? t("invalid") : t("failed"));
		}
	};

	return (
		<div className="mt-5 p-4 md:p-5 border border-border bg-card">
			<p className="label-caps text-muted-foreground">{t("pickDay")}</p>
			<div className="mt-2 gap-1.5 grid grid-cols-7">
				{dates.map((date) => {
					const midday = middayOf(date, zones.you.zone);
					const active = date === day;
					return (
						<button
							key={date}
							type="button"
							onClick={() => setDay(date)}
							aria-pressed={active}
							className={cn(
								"min-h-11 flex aspect-square flex-col items-center justify-center border text-center transition-colors focus-visible:outline-2 focus-visible:outline-ring",
								active
									? "border-2 border-foreground bg-secondary text-secondary-foreground"
									: "border-border bg-card hover:border-foreground",
							)}
						>
							<span className="label-caps">
								{new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, {
									weekday: "short",
									timeZone: zones.you.zone,
								}).format(midday)}
							</span>
							<span className="font-semibold text-ui tabular">
								{new Intl.DateTimeFormat(locale, {
									day: "numeric",
									timeZone: zones.you.zone,
								}).format(midday)}
							</span>
						</button>
					);
				})}
			</div>

			{day && (
				<p className="mt-4 font-display text-letter">
					{formatFullDay(middayOf(day, zones.you.zone), locale, zones.you.zone)}
				</p>
			)}
			<ul className="mt-2 border-t border-border">
				{times.map((time) => {
					const iso = time.toISOString();
					const selected = chosen.includes(iso);
					const bothEvening =
						isEvening(time, zones.you.zone) && isEvening(time, zones.them.zone);
					return (
						<li key={iso} className="border-b border-border">
							<button
								type="button"
								onClick={() => toggle(iso)}
								aria-pressed={selected}
								disabled={!selected && chosen.length >= MAX_SLOTS}
								className={cn(
									"gap-3 py-2.5 pl-3 pr-2 flex w-full items-center text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-40",
									bothEvening
										? "border-l border-foreground"
										: "border-l border-transparent",
									selected ? "bg-accent" : "hover:bg-accent/60",
								)}
							>
								<span aria-hidden="true" className="w-4 text-center">
									{selected ? "✓" : ""}
								</span>
								<span className="text-body tabular">
									{formatTime(time, locale, zones.you.zone)} {zones.you.place}
									{zones.you.zone !== zones.them.zone && (
										<span className="text-muted-foreground">
											{" · "}
											{formatTime(time, locale, zones.them.zone)}{" "}
											{zones.them.place}
										</span>
									)}
								</span>
								{bothEvening && (
									<span className="sr-only">{t("eveningForBoth")}</span>
								)}
							</button>
						</li>
					);
				})}
			</ul>
			<p className="mt-2 text-meta text-muted-foreground">{t("bracketNote")}</p>

			{chosen.length > 0 && (
				<div className="mt-4">
					<p className="label-caps text-muted-foreground">
						{t("yourThree", { count: chosen.length })}
					</p>
					<ul className="mt-1">
						{chosen.map((iso) => (
							<li
								key={iso}
								className="py-1.5 gap-3 flex items-center justify-between"
							>
								<SlotLabel slot={iso} zones={zones} />
								<button
									type="button"
									onClick={() => toggle(iso)}
									className="min-h-11 text-meta text-seal-ink underline-offset-4 hover:underline"
								>
									{t("remove")}
								</button>
							</li>
						))}
					</ul>
				</div>
			)}
			{error && (
				<p role="alert" className="mt-3 text-body text-destructive">
					{error}
				</p>
			)}
			<div className="mt-4 gap-3 flex flex-wrap">
				<Button
					variant="secondary"
					disabled={chosen.length !== MAX_SLOTS}
					loading={propose.isPending}
					onClick={() => void submit()}
				>
					{t("sendThree")}
				</Button>
				<Button variant="ghost" onClick={onDone}>
					{t("cancel")}
				</Button>
			</div>
		</div>
	);
}

/**
 * Three evenings that suit you both (design.md §5.6): each person ticks what works and the first
 * slot both tick is booked. Every time is labelled in both time zones.
 */
export function ProposeThreeTimes({ introduction }: { introduction: IntroductionView }) {
	const t = useTranslations("intro.times");
	const locale = useLocale();
	const zones = useZones(introduction);
	const [proposing, setProposing] = useState(false);
	const closed = introduction.stage === "closed";

	const booked = introduction.proposals.find((proposal) => proposal.status === "booked");
	const open = introduction.proposals.find((proposal) => proposal.status === "open");

	return (
		<section aria-labelledby="intro-times" className="mt-10">
			<h2 id="intro-times" className="hairline-after font-display text-section">
				{t("title")}
			</h2>
			<div className="mt-4">
				{booked?.bookedSlot ? (
					<>
						<p className="font-display text-letter">
							{t("booked", {
								day: formatFullDay(booked.bookedSlot, locale, zones.you.zone),
								you: `${formatTime(booked.bookedSlot, locale, zones.you.zone)} ${zones.you.place}`,
								them: `${formatTime(booked.bookedSlot, locale, zones.them.zone)} ${zones.them.place}`,
							})}
						</p>
						{!closed && (
							<a
								href={`/api/calls/${booked.id}/ics`}
								download
								className="mt-2 min-h-11 flex w-fit items-center text-ui text-seal-ink underline-offset-4 hover:underline"
							>
								{t("calendar")}
							</a>
						)}
					</>
				) : open ? (
					<OpenProposal proposal={open} zones={zones} introduction={introduction} />
				) : (
					<p className="pencil text-body">{t("none")}</p>
				)}
				{!closed && !proposing && (
					<button
						type="button"
						onClick={() => setProposing(true)}
						className="mt-4 min-h-11 text-ui text-seal-ink underline-offset-4 hover:underline"
					>
						{booked ? t("proposeAnother") : t("proposeOthers")}
					</button>
				)}
				{proposing && (
					<ProposeOthers
						introduction={introduction}
						zones={zones}
						onDone={() => setProposing(false)}
					/>
				)}
			</div>
		</section>
	);
}
