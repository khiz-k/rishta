"use client";

import { cn } from "@repo/ui";
import { onRovingKeyDown, rovingTabIndex } from "@shared/lib/roving";
import { MinusIcon, PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from "react";

/** Square option rows, 56px, 1px border; the chosen one has a 2px ink border and an ink tick. */
export function OptionRows<T extends string>({
	options,
	value,
	onChange,
	label,
	labelFor,
}: {
	options: readonly T[];
	value: T | null;
	onChange: (value: T) => void;
	label: string;
	labelFor: (value: T) => string;
}) {
	return (
		<div
			role="radiogroup"
			aria-label={label}
			onKeyDown={(event) => onRovingKeyDown(event)}
			className="flex flex-col"
		>
			{options.map((option, index) => {
				const selected = value === option;
				return (
					<button
						key={option}
						type="button"
						role="radio"
						aria-checked={selected}
						tabIndex={rovingTabIndex(selected, index, value !== null)}
						onClick={() => onChange(option)}
						className={cn(
							"min-h-14 px-4 gap-3 relative flex items-center text-left text-body transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
							selected
								? "z-[1] border-2 border-foreground bg-card"
								: "border border-border bg-card hover:bg-accent/60",
							index > 0 && !selected && "-mt-px",
							index > 0 && selected && "-mt-px",
						)}
					>
						<span aria-hidden="true" className="w-4 text-center font-display">
							{selected ? "✓" : ""}
						</span>
						{labelFor(option)}
					</button>
				);
			})}
		</div>
	);
}

/** Multi-select chips over a fixed list (faiths, diets, education, marital status). */
export function ChipSelect<T extends string>({
	options,
	value,
	onChange,
	label,
	labelFor,
}: {
	options: readonly T[];
	value: T[];
	onChange: (value: T[]) => void;
	label: string;
	labelFor: (value: T) => string;
}) {
	return (
		<div role="group" aria-label={label} className="gap-2 flex flex-wrap">
			{options.map((option) => {
				const selected = value.includes(option);
				return (
					<button
						key={option}
						type="button"
						aria-pressed={selected}
						onClick={() =>
							onChange(
								selected
									? value.filter((item) => item !== option)
									: [...value, option],
							)
						}
						className={cn(
							"min-h-11 px-3 border text-ui transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
							selected
								? "border-secondary bg-secondary text-secondary-foreground"
								: "border-border bg-card text-foreground hover:border-foreground",
						)}
					>
						{selected && <span aria-hidden="true">✓ </span>}
						{labelFor(option)}
					</button>
				);
			})}
		</div>
	);
}

/** Free-entry chips (communities, places, languages): type and press Enter. */
export function FreeChips({
	value,
	onChange,
	label,
	placeholder,
	max = 12,
}: {
	value: string[];
	onChange: (value: string[]) => void;
	label: string;
	placeholder: string;
	max?: number;
}) {
	const t = useTranslations("lookingFor.controls");
	const inputId = useId();
	const inputRef = useRef<HTMLInputElement>(null);

	const add = () => {
		const input = inputRef.current;
		const entry = input?.value.trim() ?? "";
		if (!input || entry.length === 0 || value.length >= max) {
			return;
		}
		if (!value.some((item) => item.toLowerCase() === entry.toLowerCase())) {
			onChange([...value, entry.slice(0, 60)]);
		}
		input.value = "";
	};

	const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter" || event.key === ",") {
			event.preventDefault();
			add();
		}
	};

	return (
		<div className="gap-2 flex flex-col">
			{value.length > 0 && (
				<ul className="gap-2 flex flex-wrap" aria-label={label}>
					{value.map((item) => (
						<li
							key={item}
							className="min-h-11 pl-3 flex items-center border border-secondary bg-secondary text-ui text-secondary-foreground"
						>
							{item}
							<button
								type="button"
								onClick={() => onChange(value.filter((entry) => entry !== item))}
								aria-label={t("remove", { item })}
								className="size-11 inline-flex items-center justify-center focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-secondary-foreground"
							>
								<XIcon className="size-4" />
							</button>
						</li>
					))}
				</ul>
			)}
			{value.length < max && (
				<div className="gap-2 flex">
					<label htmlFor={inputId} className="sr-only">
						{label}
					</label>
					<input
						ref={inputRef}
						id={inputId}
						onKeyDown={onKeyDown}
						placeholder={placeholder}
						maxLength={60}
						className="h-11 px-3 min-w-0 flex-1 border border-input bg-card text-body placeholder:text-pencil placeholder:italic focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
					/>
					<button
						type="button"
						onClick={add}
						className="h-11 px-4 font-semibold border border-foreground text-ui [font-stretch:87.5%] hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
					>
						{t("add")}
					</button>
				</div>
			)}
		</div>
	);
}

/** A numeric stepper: square − and + around a tabular number. */
export function Stepper({
	value,
	onChange,
	min,
	max,
	label,
	format = (value) => String(value),
}: {
	value: number;
	onChange: (value: number) => void;
	min: number;
	max: number;
	label: string;
	format?: (value: number) => string;
}) {
	const t = useTranslations("lookingFor.controls");
	return (
		<div
			role="group"
			aria-label={label}
			className="inline-flex items-stretch border border-foreground"
		>
			<button
				type="button"
				onClick={() => onChange(Math.max(min, value - 1))}
				disabled={value <= min}
				aria-label={t("less", { label })}
				className="size-11 inline-flex items-center justify-center hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-40"
			>
				<MinusIcon className="size-4" />
			</button>
			<output
				aria-live="polite"
				className="px-2 flex min-w-[4.5rem] items-center justify-center border-x border-foreground text-body tabular"
			>
				{format(value)}
			</output>
			<button
				type="button"
				onClick={() => onChange(Math.min(max, value + 1))}
				disabled={value >= max}
				aria-label={t("more", { label })}
				className="size-11 inline-flex items-center justify-center hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-40"
			>
				<PlusIcon className="size-4" />
			</button>
		</div>
	);
}

/** Dealbreaker · Nice to have: a two-word square toggle beside a row. */
export function DealbreakerToggle({
	value,
	onChange,
	label,
}: {
	value: boolean;
	onChange: (value: boolean) => void;
	label: string;
}) {
	const t = useTranslations("lookingFor.controls");
	return (
		<div
			role="radiogroup"
			aria-label={t("dealbreakerFor", { label })}
			onKeyDown={(event) => onRovingKeyDown(event)}
			className="inline-grid grid-cols-2 border border-foreground"
		>
			{[true, false].map((option, index) => (
				<button
					key={String(option)}
					type="button"
					role="radio"
					aria-checked={value === option}
					tabIndex={rovingTabIndex(value === option, index, true)}
					onClick={() => onChange(option)}
					className={cn(
						"min-h-11 px-3 border-foreground label-caps first:border-r focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
						value === option
							? "bg-secondary text-secondary-foreground"
							: "text-muted-foreground hover:bg-accent",
					)}
				>
					{option ? t("dealbreaker") : t("niceToHave")}
				</button>
			))}
		</div>
	);
}

export interface ValuesBudgetValue {
	personality: number;
	financial: number;
	looks: number;
}

export const VALUES_BUDGET = 12;
const ROWS = ["personality", "financial", "looks"] as const;

/**
 * What matters most (design.md §5.8): twelve ink squares across three rows, each row 1-10. The
 * squares refuse to go over the budget, exactly as the slider cap does today. On touch each
 * square sits in a 44px target and a row's ten wrap as two tallies of five (ten 44px targets
 * would not fit a 360px phone); with a mouse on a wide screen they stay one compact row.
 */
export function ValuesBudget({
	value,
	onChange,
}: {
	value: ValuesBudgetValue;
	onChange: (value: ValuesBudgetValue) => void;
}) {
	const t = useTranslations("lookingFor.values");
	const [refused, setRefused] = useState(false);
	const used = value.personality + value.financial + value.looks;
	const left = VALUES_BUDGET - used;

	const set = (row: (typeof ROWS)[number], next: number) => {
		const clamped = Math.max(1, Math.min(10, next));
		const total = used - value[row] + clamped;
		if (total > VALUES_BUDGET) {
			setRefused(true);
			return;
		}
		setRefused(false);
		onChange({ ...value, [row]: clamped });
	};

	return (
		<div>
			<p className="text-body">{t("lead")}</p>
			<div className="mt-4 gap-4 flex flex-col">
				{ROWS.map((row) => (
					<div
						key={row}
						className="gap-2 md:gap-4 md:grid-cols-[12rem_1fr_2rem] md:items-center grid grid-cols-1"
					>
						<span
							className="font-semibold text-ui [font-stretch:87.5%]"
							id={`values-${row}`}
						>
							{t(`rows.${row}`)}
						</span>
						<div
							role="slider"
							tabIndex={0}
							aria-labelledby={`values-${row}`}
							aria-valuemin={1}
							aria-valuemax={10}
							aria-valuenow={value[row]}
							aria-valuetext={t("valueText", { count: value[row], left })}
							onKeyDown={(event) => {
								if (event.key === "ArrowRight" || event.key === "ArrowUp") {
									event.preventDefault();
									set(row, value[row] + 1);
								}
								if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
									event.preventDefault();
									set(row, value[row] - 1);
								}
							}}
							className="md:pointer-fine:grid-cols-10 md:pointer-fine:gap-1 grid w-fit grid-cols-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
						>
							{Array.from({ length: 10 }, (_, index) => {
								const filled = index < value[row];
								return (
									<button
										key={index}
										type="button"
										tabIndex={-1}
										aria-hidden="true"
										onClick={() => set(row, index + 1)}
										className="group size-11 md:pointer-fine:size-7 inline-flex items-center justify-center"
									>
										<span
											className={cn(
												"size-7 border transition-colors",
												filled
													? "border-foreground bg-foreground"
													: "border-input bg-card group-hover:border-foreground",
											)}
										/>
									</button>
								);
							})}
						</div>
						<span className="md:text-right text-body tabular">{value[row]}</span>
					</div>
				))}
			</div>
			<p
				className={cn(
					"mt-4 text-ui tabular",
					left === 0 ? "text-foreground" : "text-muted-foreground",
				)}
				aria-live="polite"
			>
				{t("left", { count: left })}
			</p>
			{refused && <p className="mt-1 text-meta text-warning">{t("refused")}</p>}
		</div>
	);
}

export function Question({
	title,
	children,
	hint,
}: {
	title: string;
	children: ReactNode;
	hint?: string;
}) {
	return (
		<fieldset className="mt-8 first:mt-0">
			<legend className="font-display text-section">{title}</legend>
			{hint && <p className="mt-1 text-meta text-muted-foreground">{hint}</p>}
			<div className="mt-4">{children}</div>
		</fieldset>
	);
}
