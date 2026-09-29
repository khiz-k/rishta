"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	DEFAULT_FIELD_VISIBILITY,
	type FieldVisibility,
	type PageLanguage,
	type VisibleField,
} from "@repo/database/drizzle/domain";
import { FAMILY_LANGUAGE_NAMES } from "@repo/i18n/lib/family-languages";
import {
	Button,
	cn,
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Textarea,
} from "@repo/ui";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import type { OwnerPage } from "@shared/lib/api-types";
import { formatBirthDate, formatFeetInches, formatHeight, zonePlace } from "@shared/lib/format";
import { onRovingKeyDown, rovingTabIndex } from "@shared/lib/roving";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { allowsMatchingOnly, type FieldDef, isVisibleField } from "../lib/editor-fields";
import { isEnumField, usePageText } from "../lib/fields";
import { type FieldValue, usePagePatch } from "../lib/use-page-patch";

function rawValue(page: OwnerPage, def: FieldDef): FieldValue {
	const value = (page as Record<string, unknown>)[def.key];
	if (value === undefined) {
		return null;
	}
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean" ||
		value === null
	) {
		return value;
	}
	if (Array.isArray(value)) {
		return value.filter((item): item is string => typeof item === "string");
	}
	return null;
}

function isEmpty(value: FieldValue) {
	return (
		value === null ||
		(typeof value === "string" && value.trim() === "") ||
		(Array.isArray(value) && value.length === 0)
	);
}

function toText(value: FieldValue) {
	if (value === null) {
		return "";
	}
	if (Array.isArray(value)) {
		return value.join(", ");
	}
	return String(value);
}

const PHONE = /^\+[1-9]\d{6,14}$/;

function schemaFor(def: FieldDef) {
	const base = z.string().trim();
	switch (def.kind) {
		case "phone":
			return base.refine(
				(value) => value === "" || PHONE.test(value.replace(/[\s-]/g, "")),
				"phone",
			);
		case "country":
			return base.refine((value) => value === "" || /^[A-Za-z]{2}$/.test(value), "country");
		case "date":
			return base.regex(/^\d{4}-\d{2}-\d{2}$/, "date");
		case "time":
			return base.refine((value) => value === "" || /^\d{2}:\d{2}$/.test(value), "time");
		case "height":
			return base.refine((value) => {
				if (value === "") {
					return true;
				}
				const cm = Number(value);
				return Number.isInteger(cm) && cm >= 120 && cm <= 230;
			}, "height");
		default: {
			const limited = def.maxLength ? base.max(def.maxLength) : base;
			return def.required ? limited.min(1, "required") : limited;
		}
	}
}

function parseValue(def: FieldDef, text: string): FieldValue {
	const trimmed = text.trim();
	switch (def.kind) {
		case "list":
			return trimmed
				.split(",")
				.map((part) => part.trim())
				.filter((part) => part.length > 0)
				.slice(0, 8);
		case "height":
			return trimmed === "" ? null : Number(trimmed);
		case "phone":
			return trimmed === "" ? null : trimmed.replace(/[\s-]/g, "");
		case "country":
			return trimmed === "" ? null : trimmed.toUpperCase();
		default:
			return trimmed === "" && def.nullable ? null : trimmed;
	}
}

/** Words for a stored value: enum labels, formatted dates and heights, the page's own script. */
export function useFieldDisplay() {
	const text = usePageText();
	const t = useTranslations("biodata");
	const locale = useLocale();

	return (def: FieldDef, value: FieldValue): string | null => {
		if (isEmpty(value) || (def.key === "invocation" && value === "none")) {
			return null;
		}
		if (def.kind === "boolean") {
			return text.enumValue("hasChildren", value === true ? "yes" : "no");
		}
		if (def.kind === "height" && typeof value === "number") {
			return formatHeight(value);
		}
		if (def.kind === "date" && typeof value === "string") {
			return formatBirthDate(value, locale);
		}
		if (def.kind === "timezone" && typeof value === "string") {
			return `${zonePlace(value)} (${value})`;
		}
		if (def.kind === "choice" && typeof value === "string") {
			switch (def.optionLabels) {
				case "authors":
					return t(`authors.${value}` as Parameters<typeof t>[0]);
				case "invocations":
					return t(`invocations.${value}` as Parameters<typeof t>[0]);
				case "languages":
					return FAMILY_LANGUAGE_NAMES[value as PageLanguage] ?? value;
				default:
					return isEnumField(def.key) ? text.enumValue(def.key, value) : value;
			}
		}
		return toText(value);
	};
}

function useOptionLabel(def: FieldDef) {
	const display = useFieldDisplay();
	return (option: string) =>
		display(def, def.kind === "boolean" ? option === "yes" : option) ?? option;
}

/** A square option list: a popover on desktop, a sheet on the phone. */
function ChoicePicker({
	def,
	label,
	current,
	onChoose,
	children,
}: {
	def: FieldDef;
	label: string;
	current: FieldValue;
	onChoose: (value: FieldValue) => void;
	children: ReactNode;
}) {
	const t = useTranslations("biodata.editor");
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const [open, setOpen] = useState(false);
	const optionLabel = useOptionLabel(def);
	const options = def.kind === "boolean" ? ["yes", "no"] : (def.options ?? []);
	const currentKey =
		def.kind === "boolean"
			? current === true
				? "yes"
				: current === false
					? "no"
					: null
			: current;

	const anyChosen = options.some((option) => option === currentKey);
	// A listbox: arrows move focus, Enter or Space (or a tap) chooses, so an arrow never saves.
	const list = (
		<div className="flex flex-col">
			<div
				role="listbox"
				aria-label={label}
				onKeyDown={(event) => onRovingKeyDown(event)}
				className="flex flex-col"
			>
				{options.map((option, index) => (
					<button
						key={option}
						type="button"
						role="option"
						aria-selected={currentKey === option}
						tabIndex={rovingTabIndex(currentKey === option, index, anyChosen)}
						onClick={() => {
							setOpen(false);
							onChoose(def.kind === "boolean" ? option === "yes" : option);
						}}
						className={cn(
							"min-h-11 px-3 flex items-center justify-between border-b border-border text-left text-body last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
							currentKey === option ? "bg-accent" : "hover:bg-accent/60",
						)}
					>
						<span lang={def.optionLabels === "languages" ? option : undefined}>
							{optionLabel(option)}
						</span>
						{currentKey === option && <span aria-hidden="true">✓</span>}
					</button>
				))}
			</div>
			{def.nullable && !isEmpty(current) && (
				<button
					type="button"
					onClick={() => {
						setOpen(false);
						onChoose(null);
					}}
					className="min-h-11 px-3 text-left text-ui text-muted-foreground hover:bg-accent/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
				>
					{t("leaveEmpty")}
				</button>
			)}
		</div>
	);

	if (isDesktop) {
		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>{children}</PopoverTrigger>
				<PopoverContent align="start" className="p-0 w-72 max-h-80 overflow-y-auto">
					{list}
				</PopoverContent>
			</Popover>
		);
	}

	return (
		<>
			<span onClickCapture={() => setOpen(true)}>{children}</span>
			<Drawer open={open} onOpenChange={setOpen}>
				<DrawerContent className="max-h-[80dvh]">
					<DrawerHeader>
						<DrawerTitle>{label}</DrawerTitle>
						<DrawerDescription className="sr-only">{label}</DrawerDescription>
					</DrawerHeader>
					<div className="px-5 pb-6 overflow-y-auto pb-safe">{list}</div>
				</DrawerContent>
			</Drawer>
		</>
	);
}

const VISIBILITY_OPTIONS: FieldVisibility[] = ["page", "sealed", "matching_only"];

/** Shown · Sealed · Matching only, a three-word square control beside a value (edit mode only). */
function VisibilityTag({
	field,
	value,
	editable,
}: {
	field: VisibleField;
	value: FieldVisibility;
	editable: boolean;
}) {
	const t = useTranslations("biodata.visibility");
	const { setVisibility } = usePagePatch();
	const [open, setOpen] = useState(false);
	const [failed, setFailed] = useState(false);
	const options = VISIBILITY_OPTIONS.filter(
		(option) => option !== "matching_only" || allowsMatchingOnly(field),
	);

	const tag = (
		<span className="label-caps whitespace-nowrap text-muted-foreground">· {t(value)}</span>
	);

	if (!editable || field === "contactPhone") {
		return tag;
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					aria-label={t("change", { value: t(value) })}
					className="min-h-9 px-1 -mx-1 after:inset-x-0 after:-inset-y-1 relative inline-flex items-center after:absolute hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
				>
					{tag}
				</button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 p-3">
				{/* A tap saves at once, so these are pressed buttons rather than radios: an arrow key
				    must never change who can see a value. */}
				<div
					role="group"
					aria-label={t("label")}
					className="grid grid-flow-col border border-foreground"
				>
					{options.map((option) => (
						<button
							key={option}
							type="button"
							aria-pressed={value === option}
							onClick={() => {
								setFailed(false);
								setVisibility(field, option).then(
									() => setOpen(false),
									() => setFailed(true),
								);
							}}
							className={cn(
								"min-h-11 px-2 font-semibold border-r border-foreground text-ui [font-stretch:87.5%] last:border-r-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
								value === option
									? "bg-secondary text-secondary-foreground"
									: "hover:bg-accent",
							)}
						>
							{t(option)}
						</button>
					))}
				</div>
				<p className="mt-3 text-meta text-muted-foreground">{t(`help.${value}`)}</p>
				{allowsMatchingOnly(field) && (
					<p className="mt-2 text-meta text-muted-foreground">{t("consent")}</p>
				)}
				{failed && <p className="mt-2 text-meta text-destructive">{t("failed")}</p>}
			</PopoverContent>
		</Popover>
	);
}

/**
 * One value on the page, edited in place (design.md §5.7): the value with a dotted underline;
 * click or tap edits; Enter or blur saves; Esc cancels. Empty values show a pencil prompt. A
 * pencil "Saved" mark shows for a second.
 */
export function EditableField({
	def,
	page,
	canEdit,
	canSetVisibility,
	layout = "row",
	labelOverride,
}: {
	def: FieldDef;
	page: OwnerPage;
	canEdit: boolean;
	canSetVisibility: boolean;
	layout?: "row" | "block" | "inline";
	labelOverride?: string;
}) {
	const t = useTranslations("biodata");
	const pageText = usePageText();
	const display = useFieldDisplay();
	const { save } = usePagePatch();
	const fieldId = useId();
	const [editing, setEditing] = useState(false);
	const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
	const savedTimer = useRef<number | null>(null);
	const value = rawValue(page, def);
	const shown = display(def, value);
	const label = labelOverride ?? pageText.label(def.key);
	const prompt = t(`prompts.${def.key}` as Parameters<typeof t>[0]);

	const visibility: FieldVisibility | null = isVisibleField(def.key)
		? (page.fieldVisibility[def.key] ?? DEFAULT_FIELD_VISIBILITY[def.key])
		: null;

	useEffect(
		() => () => {
			if (savedTimer.current) {
				window.clearTimeout(savedTimer.current);
			}
		},
		[],
	);

	const commit = async (next: FieldValue) => {
		setStatus("saving");
		try {
			await save(def, next);
			setEditing(false);
			setStatus("saved");
			savedTimer.current = window.setTimeout(() => setStatus("idle"), 1000);
		} catch {
			setStatus("error");
			setEditing(true);
		}
	};

	const valueView = (
		<span
			className={cn(
				shown ? "text-foreground editable-underline" : "pencil",
				layout === "block" && "whitespace-pre-line",
			)}
		>
			{shown ?? prompt}
		</span>
	);

	const readView = canEdit ? (
		def.kind === "choice" || def.kind === "boolean" ? (
			<ChoicePicker
				def={def}
				label={label}
				current={value}
				onChoose={(next) => void commit(next)}
			>
				<button
					type="button"
					className="text-left focus-visible:outline-2 focus-visible:outline-ring"
					aria-label={t("editor.edit", { label })}
				>
					{valueView}
				</button>
			</ChoicePicker>
		) : (
			<button
				type="button"
				onClick={() => {
					setStatus("idle");
					setEditing(true);
				}}
				className="w-full text-left focus-visible:outline-2 focus-visible:outline-ring"
				aria-label={t("editor.edit", { label })}
			>
				{valueView}
			</button>
		)
	) : (
		<span className={shown ? "text-foreground" : "pencil"}>
			{shown ?? t("editor.notStated")}
		</span>
	);

	const trailing = (
		<>
			{visibility && isVisibleField(def.key) && (shown || canEdit) && (
				<>
					{" "}
					<VisibilityTag
						field={def.key}
						value={visibility}
						editable={canSetVisibility && canEdit}
					/>
				</>
			)}
			{status === "saved" && (
				<span role="status" className="ml-2 pencil text-meta">
					{t("editor.saved")}
				</span>
			)}
		</>
	);

	const editor =
		editing && def.kind !== "choice" && def.kind !== "boolean" ? (
			<InlineEditor
				id={fieldId}
				def={def}
				initial={toText(value)}
				label={label}
				error={status === "error"}
				saving={status === "saving"}
				onCancel={() => {
					setEditing(false);
					setStatus("idle");
				}}
				onSave={(text) => void commit(parseValue(def, text))}
			/>
		) : null;

	if (layout === "block") {
		return (
			<div className="mt-1">
				{editor ?? (
					<p className={cn(def.kind === "longtext" ? "text-body" : "text-body")}>
						{readView}
						{trailing}
					</p>
				)}
			</div>
		);
	}

	if (layout === "inline") {
		return (
			editor ?? (
				<span>
					{readView}
					{trailing}
				</span>
			)
		);
	}

	return (
		<div className="gap-x-4 py-1.5 grid grid-cols-[minmax(6.75rem,34%)_1fr]">
			<dt className="pt-[0.3rem] label-caps text-muted-foreground">
				<label htmlFor={editing ? fieldId : undefined}>{label}</label>
			</dt>
			<dd className="min-w-0 text-body break-words">
				{editor ?? (
					<>
						{readView}
						{trailing}
					</>
				)}
			</dd>
		</div>
	);
}

function InlineEditor({
	id,
	def,
	initial,
	label,
	error,
	saving,
	onCancel,
	onSave,
}: {
	id: string;
	def: FieldDef;
	initial: string;
	label: string;
	error: boolean;
	saving: boolean;
	onCancel: () => void;
	onSave: (value: string) => void;
}) {
	const t = useTranslations("biodata.editor");
	const schema = useMemo(() => z.object({ value: schemaFor(def) }), [def]);
	const form = useForm<{ value: string }>({
		resolver: zodResolver(schema),
		defaultValues: { value: initial },
	});
	const current = useWatch({ control: form.control, name: "value" });
	const cancelling = useRef(false);

	// Editing starts where the value sits: focus moves straight into the field.
	useEffect(() => {
		document.getElementById(id)?.focus();
	}, [id]);

	// Blur and the Save button can both submit; one edit saves once.
	const submitted = useRef(false);
	useEffect(() => {
		if (error) {
			submitted.current = false;
		}
	}, [error]);

	const submit = form.handleSubmit(({ value }) => {
		if (submitted.current) {
			return;
		}
		if (value.trim() === initial.trim()) {
			onCancel();
			return;
		}
		submitted.current = true;
		onSave(value);
	});

	const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (event.key === "Escape") {
			event.preventDefault();
			cancelling.current = true;
			onCancel();
		}
		if (event.key === "Enter" && (def.kind !== "longtext" || event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			void submit();
		}
	};

	const onBlur = () => {
		window.setTimeout(() => {
			if (!cancelling.current) {
				void submit();
			}
		}, 0);
	};

	const fieldError = form.formState.errors.value?.message;
	const errorText = fieldError
		? t(
				`invalid.${fieldError === "required" || fieldError === "phone" || fieldError === "country" || fieldError === "date" || fieldError === "time" || fieldError === "height" ? fieldError : "generic"}`,
			)
		: null;

	const register = form.register("value");
	const inputProps = {
		...register,
		id,
		onKeyDown,
		onBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			void register.onBlur(event);
			onBlur();
		},
		"aria-invalid": Boolean(errorText) || error,
		"aria-label": label,
		disabled: saving,
	};

	return (
		<form onSubmit={submit} className="gap-2 flex flex-col" noValidate>
			{def.kind === "longtext" ? (
				<Textarea
					{...inputProps}
					rows={6}
					maxLength={def.maxLength}
					className="text-body"
				/>
			) : def.kind === "timezone" ? (
				<TimeZoneSelect
					id={id}
					value={current}
					onChange={(zone) => form.setValue("value", zone)}
					onCommit={() => void submit()}
					onCancel={() => {
						cancelling.current = true;
						onCancel();
					}}
				/>
			) : (
				<Input
					{...inputProps}
					type={
						def.kind === "date"
							? "date"
							: def.kind === "time"
								? "time"
								: def.kind === "height"
									? "number"
									: def.kind === "phone"
										? "tel"
										: "text"
					}
					inputMode={
						def.kind === "height" ? "numeric" : def.kind === "phone" ? "tel" : undefined
					}
					maxLength={def.kind === "country" ? 2 : def.maxLength}
					placeholder={
						def.kind === "phone"
							? "+17325550199"
							: def.kind === "country"
								? "US"
								: undefined
					}
				/>
			)}
			{def.kind === "height" && current && Number(current) >= 120 && (
				<span className="text-meta text-muted-foreground">
					{formatFeetInches(Number(current))}
				</span>
			)}
			{def.kind === "list" && (
				<span className="text-meta text-muted-foreground">{t("listHint")}</span>
			)}
			{(errorText || error) && (
				<p role="alert" className="text-meta text-destructive">
					{errorText ?? t("notSaved")}
				</p>
			)}
			{def.kind === "longtext" && (
				<div className="gap-2 flex">
					<Button type="submit" size="sm" variant="secondary" loading={saving}>
						{t("save")}
					</Button>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						onMouseDown={() => {
							cancelling.current = true;
						}}
						onClick={onCancel}
					>
						{t("cancel")}
					</Button>
				</div>
			)}
		</form>
	);
}

function TimeZoneSelect({
	id,
	value,
	onChange,
	onCommit,
	onCancel,
}: {
	id: string;
	value: string;
	onChange: (zone: string) => void;
	onCommit: () => void;
	onCancel: () => void;
}) {
	const zones = useMemo(() => {
		try {
			return Intl.supportedValuesOf("timeZone");
		} catch {
			return [value];
		}
	}, [value]);
	return (
		<select
			id={id}
			value={value}
			onChange={(event) => onChange(event.target.value)}
			onKeyDown={(event) => {
				if (event.key === "Escape") {
					onCancel();
				}
				if (event.key === "Enter") {
					event.preventDefault();
					onCommit();
				}
			}}
			onBlur={onCommit}
			className="h-11 px-3 w-full border border-input bg-card text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
		>
			{zones.map((zone) => (
				<option key={zone} value={zone}>
					{zonePlace(zone)} ({zone})
				</option>
			))}
		</select>
	);
}
