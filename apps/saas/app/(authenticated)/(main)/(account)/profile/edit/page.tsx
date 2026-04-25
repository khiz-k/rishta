"use client";

import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { PageHeader } from "@shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const RELIGIONS = ["hindu", "muslim", "sikh", "christian", "jain", "buddhist", "other"];
const MARITAL = ["never_married", "divorced", "widowed", "annulled"];
const DIETS = ["veg", "non_veg", "eggetarian", "vegan", "jain_veg"];
const HABITS = ["never", "occasionally", "regularly"];
const DRINKING = ["never", "occasionally", "socially", "regularly"];
const INCOME = ["under_50k", "50k_75k", "75k_100k", "100k_150k", "150k_plus", "prefer_not_to_say"];
const CREATED_BY = ["self", "parent", "sibling", "relative"];

export default function EditProfilePage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: existing } = useQuery(orpc.profiles.me.queryOptions({}));

	const [form, setForm] = useState({
		displayName: "", gender: "male" as "male" | "female", dateOfBirth: "", height: "",
		religion: "", community: "", motherTongue: "", maritalStatus: "never_married",
		education: "", university: "", profession: "", employer: "", incomeRange: "",
		familyType: "", fatherOccupation: "", motherOccupation: "", siblings: "",
		diet: "non_veg", smoking: "never", drinking: "never",
		aboutMe: "", lookingFor: "", createdBy: "self", location: "",
	});

	useEffect(() => {
		if (existing) {
			setForm({
				displayName: existing.displayName || "",
				gender: existing.gender as "male" | "female",
				dateOfBirth: existing.dateOfBirth || "",
				height: existing.height?.toString() || "",
				religion: existing.religion || "",
				community: existing.community || "",
				motherTongue: existing.motherTongue || "",
				maritalStatus: existing.maritalStatus || "never_married",
				education: existing.education || "",
				university: existing.university || "",
				profession: existing.profession || "",
				employer: existing.employer || "",
				incomeRange: existing.incomeRange || "",
				familyType: existing.familyType || "",
				fatherOccupation: existing.fatherOccupation || "",
				motherOccupation: existing.motherOccupation || "",
				siblings: existing.siblings || "",
				diet: existing.diet || "non_veg",
				smoking: existing.smoking || "never",
				drinking: existing.drinking || "never",
				aboutMe: existing.aboutMe || "",
				lookingFor: existing.lookingFor || "",
				createdBy: existing.createdBy || "self",
				location: existing.location || "",
			});
		}
	}, [existing]);

	const mutation = useMutation({
		...orpc.profiles.upsert.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.profiles.me.queryKey({}) });
			router.push("/");
		},
	});

	const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

	const handleSubmit = () => {
		if (!form.displayName || !form.dateOfBirth || !form.religion) return;
		mutation.mutate({
			...form,
			height: form.height ? Number.parseInt(form.height) : undefined,
			maritalStatus: form.maritalStatus as any,
			diet: form.diet as any,
			smoking: form.smoking as any,
			drinking: form.drinking as any,
			createdBy: form.createdBy as any,
			gender: form.gender,
		});
	};

	return (
		<div className="space-y-6 max-w-2xl">
			<PageHeader title={existing ? "Edit Biodata" : "Create Biodata"} subtitle="Fill in your details" />

			<Card>
				<CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div><Label>Display Name *</Label><Input placeholder="Priya S." value={form.displayName} onChange={(e) => set("displayName", e.target.value)} /></div>
						<div><Label>Gender *</Label>
							<Select value={form.gender} onValueChange={(v) => set("gender", v)}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
							</Select>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div><Label>Date of Birth *</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} /></div>
						<div><Label>Height (cm)</Label><Input type="number" placeholder="170" value={form.height} onChange={(e) => set("height", e.target.value)} /></div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div><Label>Religion *</Label>
							<Select value={form.religion} onValueChange={(v) => set("religion", v)}>
								<SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
								<SelectContent>{RELIGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
							</Select>
						</div>
						<div><Label>Community</Label><Input placeholder="Punjabi, Gujarati..." value={form.community} onChange={(e) => set("community", e.target.value)} /></div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div><Label>Mother Tongue</Label><Input placeholder="Hindi, Urdu..." value={form.motherTongue} onChange={(e) => set("motherTongue", e.target.value)} /></div>
						<div><Label>Marital Status</Label>
							<Select value={form.maritalStatus} onValueChange={(v) => set("maritalStatus", v)}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>{MARITAL.map((m) => <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
							</Select>
						</div>
					</div>
					<div><Label>Location</Label><Input placeholder="Dallas, TX, USA" value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
					<div><Label>Profile Created By</Label>
						<Select value={form.createdBy} onValueChange={(v) => set("createdBy", v)}>
							<SelectTrigger><SelectValue /></SelectTrigger>
							<SelectContent>{CREATED_BY.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>Education & Career</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div><Label>Education</Label><Input placeholder="Masters, Bachelors..." value={form.education} onChange={(e) => set("education", e.target.value)} /></div>
						<div><Label>University</Label><Input placeholder="University name" value={form.university} onChange={(e) => set("university", e.target.value)} /></div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div><Label>Profession</Label><Input placeholder="Software Engineer, Doctor..." value={form.profession} onChange={(e) => set("profession", e.target.value)} /></div>
						<div><Label>Employer</Label><Input placeholder="Company name" value={form.employer} onChange={(e) => set("employer", e.target.value)} /></div>
					</div>
					<div><Label>Income Range</Label>
						<Select value={form.incomeRange} onValueChange={(v) => set("incomeRange", v)}>
							<SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
							<SelectContent>{INCOME.map((i) => <SelectItem key={i} value={i}>{i.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>Family</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div><Label>Family Type</Label>
							<Select value={form.familyType} onValueChange={(v) => set("familyType", v)}>
								<SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
								<SelectContent><SelectItem value="joint">Joint</SelectItem><SelectItem value="nuclear">Nuclear</SelectItem></SelectContent>
							</Select>
						</div>
						<div><Label>Siblings</Label><Input placeholder="1 brother, 2 sisters" value={form.siblings} onChange={(e) => set("siblings", e.target.value)} /></div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div><Label>Father's Occupation</Label><Input value={form.fatherOccupation} onChange={(e) => set("fatherOccupation", e.target.value)} /></div>
						<div><Label>Mother's Occupation</Label><Input value={form.motherOccupation} onChange={(e) => set("motherOccupation", e.target.value)} /></div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>Lifestyle</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-3 gap-4">
						<div><Label>Diet</Label>
							<Select value={form.diet} onValueChange={(v) => set("diet", v)}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>{DIETS.map((d) => <SelectItem key={d} value={d}>{d.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
							</Select>
						</div>
						<div><Label>Smoking</Label>
							<Select value={form.smoking} onValueChange={(v) => set("smoking", v)}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>{HABITS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
							</Select>
						</div>
						<div><Label>Drinking</Label>
							<Select value={form.drinking} onValueChange={(v) => set("drinking", v)}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>{DRINKING.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>About</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					<div><Label>About Me</Label><Textarea placeholder="Tell people about yourself..." value={form.aboutMe} onChange={(e) => set("aboutMe", e.target.value)} rows={3} /></div>
					<div><Label>Looking For</Label><Textarea placeholder="What are you looking for in a partner?" value={form.lookingFor} onChange={(e) => set("lookingFor", e.target.value)} rows={3} /></div>
				</CardContent>
			</Card>

			<Button onClick={handleSubmit} loading={mutation.isPending} className="w-full" size="lg">
				{existing ? "Save Changes" : "Create Profile"}
			</Button>
		</div>
	);
}
