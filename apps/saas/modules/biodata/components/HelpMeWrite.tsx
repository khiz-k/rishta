"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHousehold } from "@household/components/HouseholdProvider";
import { Button, Checkbox, cn, Textarea } from "@repo/ui";
import { useErrorText } from "@shared/hooks/use-error-text";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

export type DraftSection = "aboutMe" | "aboutFamily" | "lookingFor";
export const DRAFT_SECTIONS: DraftSection[] = ["aboutMe", "aboutFamily", "lookingFor"];

export interface Drafts {
	aboutMe?: string;
	aboutFamily?: string;
	lookingFor?: string;
	omittedPhrases: string[];
	source: "ai" | "template";
}

const TONES = ["warm", "simple", "formal"] as const;

const schema = z.object({
	tone: z.enum(TONES),
	family: z.string().trim().max(280),
	everyday: z.string().trim().max(280),
	hopes: z.string().trim().max(280),
	sections: z.array(z.enum(["aboutMe", "aboutFamily", "lookingFor"])).min(1),
});
type Values = z.infer<typeof schema>;

/**
 * Help me write (design.md §5.7, spec.md §9a): three short questions and a tone. The draft
 * appears in pencil inside the field with [Use this draft] and [Try again]; it never saves on
 * its own and never writes about complexion. Without an AI key the same questions build a plain
 * draft from your own words.
 */
export function HelpMeWrite({ onDrafts }: { onDrafts: (drafts: Drafts) => void }) {
	const t = useTranslations("biodata.help");
	const errorText = useErrorText();
	const { organizationId } = useHousehold();
	const { data: status } = useQuery({ ...orpc.ai.status.queryOptions(), staleTime: 10 * 60_000 });
	const draft = useMutation(orpc.ai.draftBiodata.mutationOptions());
	const aiOn = status?.enabled ?? false;

	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: {
			tone: "warm",
			family: "",
			everyday: "",
			hopes: "",
			sections: ["aboutMe", "aboutFamily", "lookingFor"],
		},
	});
	const tone = useWatch({ control: form.control, name: "tone" });

	const onSubmit = form.handleSubmit(async (values) => {
		form.clearErrors("root");
		try {
			const result = await draft.mutateAsync({
				organizationId,
				tone: values.tone,
				answers: { family: values.family, everyday: values.everyday, hopes: values.hopes },
				sections: values.sections,
			});
			onDrafts(result);
		} catch (error) {
			form.setError("root", { message: errorText(error) });
		}
	});

	return (
		<form onSubmit={onSubmit} className="gap-4 flex flex-col" noValidate>
			<div>
				<h3 className="label-caps text-muted-foreground">
					{aiOn ? t("title") : t("titleNoAi")}
				</h3>
				<p className="mt-1 text-meta text-muted-foreground">
					{aiOn ? t("lead") : t("leadNoAi")}
				</p>
			</div>
			{(["family", "everyday", "hopes"] as const).map((question) => (
				<label key={question} className="gap-1 flex flex-col">
					<span className="font-semibold text-ui [font-stretch:87.5%]">
						{t(`questions.${question}`)}
					</span>
					<Textarea
						{...form.register(question)}
						rows={2}
						maxLength={280}
						placeholder={t(`placeholders.${question}`)}
						className="min-h-[3.5rem] text-ui"
					/>
				</label>
			))}
			<fieldset>
				<legend className="mb-1.5 label-caps text-muted-foreground">{t("tone")}</legend>
				<div className="grid grid-cols-3 border border-foreground">
					{TONES.map((value) => (
						<button
							key={value}
							type="button"
							aria-pressed={tone === value}
							onClick={() => form.setValue("tone", value)}
							className={cn(
								"min-h-11 font-semibold border-r border-foreground text-ui [font-stretch:87.5%] last:border-r-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
								tone === value
									? "bg-secondary text-secondary-foreground"
									: "hover:bg-accent",
							)}
						>
							{t(`tones.${value}`)}
						</button>
					))}
				</div>
			</fieldset>
			<Controller
				control={form.control}
				name="sections"
				render={({ field }) => (
					<fieldset>
						<legend className="mb-1 label-caps text-muted-foreground">
							{t("which")}
						</legend>
						{DRAFT_SECTIONS.map((section) => (
							<label
								key={section}
								className="gap-3 min-h-11 flex cursor-pointer items-center"
							>
								<Checkbox
									checked={field.value.includes(section)}
									onCheckedChange={(checked) =>
										field.onChange(
											checked === true
												? [...field.value, section]
												: field.value.filter((value) => value !== section),
										)
									}
								/>
								<span className="text-ui">{t(`sections.${section}`)}</span>
							</label>
						))}
					</fieldset>
				)}
			/>
			{form.formState.errors.root && (
				<p role="alert" className="text-meta text-destructive">
					{form.formState.errors.root.message}
				</p>
			)}
			<div className="gap-3 flex items-center">
				<Button
					type="submit"
					size="sm"
					variant="secondary"
					loading={form.formState.isSubmitting}
				>
					{t("submit")}
				</Button>
				{form.formState.isSubmitting && (
					<span className="pencil text-meta">{t("drafting")}</span>
				)}
			</div>
		</form>
	);
}

/** A draft in pencil inside its field: [Use this draft] [Try again] (spec.md §9a). */
export function DraftInPencil({
	text,
	onUse,
	onDiscard,
	using,
}: {
	text: string;
	onUse: () => void;
	onDiscard: () => void;
	using: boolean;
}) {
	const t = useTranslations("biodata.help");
	return (
		<div className="mt-3 p-4 border border-dashed border-input bg-background">
			<p className="label-caps text-muted-foreground">{t("draftLabel")}</p>
			<p className="mt-2 pencil text-letter whitespace-pre-line">{text}</p>
			<div className="mt-3 gap-3 flex flex-wrap">
				<Button size="sm" variant="secondary" onClick={onUse} loading={using}>
					{t("use")}
				</Button>
				<Button size="sm" variant="ghost" onClick={onDiscard}>
					{t("discard")}
				</Button>
			</div>
			<p className="mt-2 text-meta text-muted-foreground">{t("neverSaves")}</p>
		</div>
	);
}
