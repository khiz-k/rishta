"use client";

import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STEPS = [
	{ id: "timeline", title: "The non-negotiables", subtitle: "Be honest — it helps us match you with people on the same timeline." },
	{ id: "location", title: "Location & Residency", subtitle: "Where you live matters for making this work." },
	{ id: "background", title: "Background & Family", subtitle: "Language, community, and family preferences." },
	{ id: "dealbreakers", title: "Dealbreakers", subtitle: "Things you absolutely cannot compromise on." },
	{ id: "values", title: "What matters most to you?", subtitle: "This helps us understand your priorities in a partner." },
];

export default function QuizPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [step, setStep] = useState(0);

	const [answers, setAnswers] = useState({
		marriageTimeline: "",
		willingToRelocate: null as boolean | null,
		requiresCitizenship: null as boolean | null,
		ageMin: "",
		ageMax: "",
		locations: "",
		communities: "",
		educationLevels: "",
		religions: "",
		diet: "",
		valuesLooks: 4,
		valuesPersonality: 4,
		valuesFinancial: 4,
	});

	const TOTAL_POINTS = 12;
	const pointsUsed = answers.valuesLooks + answers.valuesPersonality + answers.valuesFinancial;
	const pointsLeft = TOTAL_POINTS - pointsUsed;

	const mutation = useMutation({
		...orpc.preferences.upsert.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.preferences.get.queryKey({}) });
			router.push("/profile/edit");
		},
	});

	const set = (key: string, value: any) => setAnswers((a) => ({ ...a, [key]: value }));

	const canAdvance = () => {
		if (step === 0) return !!answers.marriageTimeline;
		if (step === 1) return answers.willingToRelocate !== null && answers.requiresCitizenship !== null;
		return true;
	};

	const handleNext = () => {
		if (step < STEPS.length - 1) {
			setStep(step + 1);
		} else {
			mutation.mutate({
				marriageTimeline: answers.marriageTimeline,
				willingToRelocate: answers.willingToRelocate ?? undefined,
				requiresCitizenship: answers.requiresCitizenship ?? undefined,
				ageMin: answers.ageMin ? Number.parseInt(answers.ageMin) : undefined,
				ageMax: answers.ageMax ? Number.parseInt(answers.ageMax) : undefined,
				locations: answers.locations || undefined,
				communities: answers.communities || undefined,
				educationLevels: answers.educationLevels || undefined,
				religions: answers.religions || undefined,
				diet: answers.diet || undefined,
				valuesLooks: answers.valuesLooks,
				valuesPersonality: answers.valuesPersonality,
				valuesFinancial: answers.valuesFinancial,
				quizComplete: true,
			});
		}
	};

	const handleBack = () => {
		if (step > 0) setStep(step - 1);
	};

	const OptionButton = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
		<motion.button
			type="button"
			onClick={onClick}
			whileTap={{ scale: 0.95 }}
			className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
				selected ? "border-primary bg-primary/10 text-foreground" : "border-border hover:border-primary/30 text-muted-foreground"
			}`}
		>
			{label}
		</motion.button>
	);

	const SliderInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label className="text-sm">{label}</Label>
				<span className="text-sm font-display font-bold text-primary">{value}/10</span>
			</div>
			<input
				type="range"
				min={1}
				max={10}
				value={value}
				onChange={(e) => onChange(Number.parseInt(e.target.value))}
				className="w-full accent-primary"
			/>
			<div className="flex justify-between text-[10px] text-muted-foreground">
				<span>Not important</span>
				<span>Essential</span>
			</div>
		</div>
	);

	return (
		<div className="flex flex-col items-center min-h-[60vh] justify-center">
			{/* Progress */}
			<div className="w-full max-w-md mb-8">
				<div className="flex gap-1.5 mb-2">
					{STEPS.map((_, i) => (
						<div
							key={i}
							className={`h-1 flex-1 rounded-full transition-all duration-500 ${
								i <= step ? "bg-primary" : "bg-muted"
							}`}
						/>
					))}
				</div>
				<p className="text-xs text-muted-foreground text-center">Step {step + 1} of {STEPS.length}</p>
			</div>

			<AnimatePresence mode="wait">
				<motion.div
					key={step}
					initial={{ opacity: 0, x: 30 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: -30 }}
					transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
					className="w-full max-w-md"
				>
					<Card className="overflow-hidden">
						<CardContent className="pt-8 pb-6">
							<h2 className="font-display text-xl font-bold">{STEPS[step]!.title}</h2>
							<p className="text-sm text-muted-foreground mt-1 mb-6">{STEPS[step]!.subtitle}</p>

							{/* Step 1: Timeline */}
							{step === 0 && (
								<div className="space-y-3">
									{[
										{ value: "3_months", label: "Within 3 months" },
										{ value: "6_months", label: "Within 6 months" },
										{ value: "1_year", label: "Within a year" },
										{ value: "2_years_plus", label: "2 years or more — no rush" },
									].map((opt) => (
										<OptionButton
											key={opt.value}
											label={opt.label}
											selected={answers.marriageTimeline === opt.value}
											onClick={() => set("marriageTimeline", opt.value)}
										/>
									))}
								</div>
							)}

							{/* Step 2: Location & Residency */}
							{step === 1 && (
								<div className="space-y-5">
									<div>
										<p className="text-sm font-medium mb-3">Are you willing to relocate for the right person?</p>
										<div className="flex gap-3">
											<OptionButton label="Yes, I'm flexible" selected={answers.willingToRelocate === true} onClick={() => set("willingToRelocate", true)} />
											<OptionButton label="No, they should be near me" selected={answers.willingToRelocate === false} onClick={() => set("willingToRelocate", false)} />
										</div>
									</div>
									<div>
										<p className="text-sm font-medium mb-3">Do you require someone who is a citizen or permanent resident?</p>
										<div className="flex gap-3">
											<OptionButton label="Yes, it matters" selected={answers.requiresCitizenship === true} onClick={() => set("requiresCitizenship", true)} />
											<OptionButton label="No, open to anyone" selected={answers.requiresCitizenship === false} onClick={() => set("requiresCitizenship", false)} />
										</div>
									</div>
									<div>
										<Label className="text-sm">Preferred locations</Label>
										<Input placeholder="e.g. New York, London, Toronto" value={answers.locations} onChange={(e) => set("locations", e.target.value)} className="mt-1" />
										<p className="text-xs text-muted-foreground mt-1">Comma-separated cities or countries</p>
									</div>
								</div>
							)}

							{/* Step 3: Background & Family */}
							{step === 2 && (
								<div className="space-y-4">
									<div className="grid grid-cols-2 gap-3">
										<div>
											<Label className="text-sm">Min age</Label>
											<Input type="number" placeholder="25" value={answers.ageMin} onChange={(e) => set("ageMin", e.target.value)} />
										</div>
										<div>
											<Label className="text-sm">Max age</Label>
											<Input type="number" placeholder="35" value={answers.ageMax} onChange={(e) => set("ageMax", e.target.value)} />
										</div>
									</div>
									<div>
										<Label className="text-sm">Community / Ethnicity</Label>
										<Input placeholder="e.g. Punjabi, Korean, Italian, any" value={answers.communities} onChange={(e) => set("communities", e.target.value)} className="mt-1" />
										<p className="text-xs text-muted-foreground mt-1">Leave empty if open to all backgrounds</p>
									</div>
									<div>
										<Label className="text-sm">Education level preferred</Label>
										<Input placeholder="e.g. Bachelors, Masters, PhD, any" value={answers.educationLevels} onChange={(e) => set("educationLevels", e.target.value)} className="mt-1" />
									</div>
								</div>
							)}

							{/* Step 4: Dealbreakers */}
							{step === 3 && (
								<div className="space-y-4">
									<div>
										<Label className="text-sm">Religion (dealbreaker?)</Label>
										<Input placeholder="e.g. Muslim, Christian, Hindu, any" value={answers.religions} onChange={(e) => set("religions", e.target.value)} className="mt-1" />
										<p className="text-xs text-muted-foreground mt-1">Leave empty if open to all</p>
									</div>
									<div>
										<Label className="text-sm">Diet preference</Label>
										<Input placeholder="e.g. halal, vegetarian, any" value={answers.diet} onChange={(e) => set("diet", e.target.value)} className="mt-1" />
									</div>
								</div>
							)}

							{/* Step 5: Values — Point Allocation */}
							{step === 4 && (
								<div className="space-y-6">
									<div className={`text-center rounded-xl p-3 ${pointsLeft === 0 ? "bg-emerald-500/10 text-emerald-500" : pointsLeft < 0 ? "bg-destructive/10 text-destructive" : "bg-accent"}`}>
										<p className="font-display font-bold text-lg">{pointsLeft} points left</p>
										<p className="text-xs opacity-70">Distribute {TOTAL_POINTS} points across what matters most. You can't max everything — make tradeoffs.</p>
									</div>
									<SliderInput label="Physical attraction" value={answers.valuesLooks} onChange={(v) => {
										const newTotal = v + answers.valuesPersonality + answers.valuesFinancial;
										if (newTotal <= TOTAL_POINTS) set("valuesLooks", v);
									}} />
									<SliderInput label="Personality & character" value={answers.valuesPersonality} onChange={(v) => {
										const newTotal = answers.valuesLooks + v + answers.valuesFinancial;
										if (newTotal <= TOTAL_POINTS) set("valuesPersonality", v);
									}} />
									<SliderInput label="Financial stability" value={answers.valuesFinancial} onChange={(v) => {
										const newTotal = answers.valuesLooks + answers.valuesPersonality + v;
										if (newTotal <= TOTAL_POINTS) set("valuesFinancial", v);
									}} />
								</div>
							)}
						</CardContent>
					</Card>

					{/* Buttons */}
					<div className="flex gap-3 mt-4">
						{step > 0 && (
							<Button variant="outline" onClick={handleBack} className="flex-1">
								Back
							</Button>
						)}
						<Button
							onClick={handleNext}
							disabled={!canAdvance()}
							loading={mutation.isPending}
							className="flex-1"
						>
							{step === STEPS.length - 1 ? "Build my profile" : "Continue"}
						</Button>
					</div>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
