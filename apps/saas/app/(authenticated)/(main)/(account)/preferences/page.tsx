"use client";

import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { PageHeader } from "@shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SlidersHorizontalIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function PreferencesPage() {
	const queryClient = useQueryClient();
	const { data: existing, isLoading } = useQuery(orpc.preferences.get.queryOptions({}));

	const [form, setForm] = useState({
		ageMin: "", ageMax: "", heightMin: "", heightMax: "",
		religions: "", communities: "", educationLevels: "",
		professions: "", locations: "", diet: "", maritalStatus: "",
	});

	useEffect(() => {
		if (existing) {
			setForm({
				ageMin: existing.ageMin?.toString() || "",
				ageMax: existing.ageMax?.toString() || "",
				heightMin: existing.heightMin?.toString() || "",
				heightMax: existing.heightMax?.toString() || "",
				religions: existing.religions || "",
				communities: existing.communities || "",
				educationLevels: existing.educationLevels || "",
				professions: existing.professions || "",
				locations: existing.locations || "",
				diet: existing.diet || "",
				maritalStatus: existing.maritalStatus || "",
			});
		}
	}, [existing]);

	const mutation = useMutation({
		...orpc.preferences.upsert.mutationOptions(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.preferences.get.queryKey({}) }),
	});

	const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

	const handleSave = () => {
		mutation.mutate({
			ageMin: form.ageMin ? Number.parseInt(form.ageMin) : undefined,
			ageMax: form.ageMax ? Number.parseInt(form.ageMax) : undefined,
			heightMin: form.heightMin ? Number.parseInt(form.heightMin) : undefined,
			heightMax: form.heightMax ? Number.parseInt(form.heightMax) : undefined,
			religions: form.religions || undefined,
			communities: form.communities || undefined,
			educationLevels: form.educationLevels || undefined,
			professions: form.professions || undefined,
			locations: form.locations || undefined,
			diet: form.diet || undefined,
			maritalStatus: form.maritalStatus || undefined,
		});
	};

	if (isLoading) {
		return <div className="space-y-6"><PageHeader title="Partner Preferences" /><Card><CardContent className="pt-6"><div className="h-40 bg-muted rounded animate-pulse" /></CardContent></Card></div>;
	}

	return (
		<div className="space-y-6 max-w-2xl">
			<PageHeader title="Partner Preferences" subtitle="Set your ideal match criteria" />

			<Card>
				<CardHeader><CardTitle className="flex items-center gap-2"><SlidersHorizontalIcon className="size-4 text-primary" /> Age & Height</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div><Label>Min Age</Label><Input type="number" placeholder="25" value={form.ageMin} onChange={(e) => set("ageMin", e.target.value)} /></div>
						<div><Label>Max Age</Label><Input type="number" placeholder="35" value={form.ageMax} onChange={(e) => set("ageMax", e.target.value)} /></div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div><Label>Min Height (cm)</Label><Input type="number" placeholder="155" value={form.heightMin} onChange={(e) => set("heightMin", e.target.value)} /></div>
						<div><Label>Max Height (cm)</Label><Input type="number" placeholder="180" value={form.heightMax} onChange={(e) => set("heightMax", e.target.value)} /></div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>Background</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					<div><Label>Religions</Label><Input placeholder='e.g. hindu, muslim, sikh' value={form.religions} onChange={(e) => set("religions", e.target.value)} /><p className="text-xs text-muted-foreground mt-1">Comma-separated</p></div>
					<div><Label>Communities</Label><Input placeholder='e.g. punjabi, gujarati' value={form.communities} onChange={(e) => set("communities", e.target.value)} /></div>
					<div><Label>Education Levels</Label><Input placeholder='e.g. bachelors, masters, phd' value={form.educationLevels} onChange={(e) => set("educationLevels", e.target.value)} /></div>
					<div><Label>Professions</Label><Input placeholder='e.g. engineer, doctor, lawyer' value={form.professions} onChange={(e) => set("professions", e.target.value)} /></div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>Lifestyle & Location</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					<div><Label>Locations</Label><Input placeholder='e.g. Dallas, Toronto, London' value={form.locations} onChange={(e) => set("locations", e.target.value)} /></div>
					<div><Label>Diet</Label><Input placeholder='e.g. veg, non_veg' value={form.diet} onChange={(e) => set("diet", e.target.value)} /></div>
					<div><Label>Marital Status</Label><Input placeholder='e.g. never_married' value={form.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)} /></div>
				</CardContent>
			</Card>

			<Button onClick={handleSave} loading={mutation.isPending} className="w-full" size="lg">
				{mutation.isSuccess ? "✅ Saved!" : "Save Preferences"}
			</Button>
		</div>
	);
}
