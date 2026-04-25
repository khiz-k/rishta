"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { PageHeader } from "@shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { EditIcon, MapPinIcon, GraduationCapIcon, BriefcaseIcon, HeartIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

function calcAge(dob: string): number {
	const birth = new Date(dob);
	const today = new Date();
	let age = today.getFullYear() - birth.getFullYear();
	if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
	return age;
}

export default function ProfilePage() {
	const { data: profile, isLoading } = useQuery(orpc.profiles.me.queryOptions({}));

	if (isLoading) {
		return (
			<div className="space-y-6">
				<PageHeader title="My Biodata" />
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<Card key={i}><CardContent className="pt-6"><div className="h-20 bg-muted rounded animate-pulse" /></CardContent></Card>
					))}
				</div>
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="space-y-6">
				<PageHeader title="My Biodata" />
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<p className="font-display font-semibold text-lg">No profile yet</p>
						<p className="text-sm text-muted-foreground mt-1 mb-4">Create your biodata to get started</p>
						<Link href="/profile/edit">
							<Button><EditIcon className="size-4 mr-1" /> Create Biodata</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	const age = calcAge(profile.dateOfBirth);

	const sections = [
		{
			title: "Basic Info",
			icon: HeartIcon,
			items: [
				{ label: "Age", value: `${age} years` },
				{ label: "Height", value: profile.height ? `${profile.height} cm` : "—" },
				{ label: "Religion", value: profile.religion },
				{ label: "Community", value: profile.community || "—" },
				{ label: "Mother Tongue", value: profile.motherTongue || "—" },
				{ label: "Marital Status", value: profile.maritalStatus.replace(/_/g, " ") },
				{ label: "Diet", value: profile.diet.replace(/_/g, " ") },
			],
		},
		{
			title: "Education & Career",
			icon: GraduationCapIcon,
			items: [
				{ label: "Education", value: profile.education || "—" },
				{ label: "University", value: profile.university || "—" },
				{ label: "Profession", value: profile.profession || "—" },
				{ label: "Employer", value: profile.employer || "—" },
				{ label: "Income", value: profile.incomeRange?.replace(/_/g, " ") || "—" },
			],
		},
		{
			title: "Family",
			icon: UsersIcon,
			items: [
				{ label: "Family Type", value: profile.familyType || "—" },
				{ label: "Father's Occupation", value: profile.fatherOccupation || "—" },
				{ label: "Mother's Occupation", value: profile.motherOccupation || "—" },
				{ label: "Siblings", value: profile.siblings || "—" },
			],
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<PageHeader title="My Biodata" />
				<Link href="/profile/edit"><Button variant="outline"><EditIcon className="size-4 mr-1" /> Edit</Button></Link>
			</div>

			{/* Header card */}
			<Card className="relative overflow-hidden">
				<div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-rose-500/80 to-rose-500/20" />
				<CardContent className="pt-6 flex items-center gap-4">
					<div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-display font-bold text-primary">
						{profile.displayName.charAt(0)}
					</div>
					<div>
						<h2 className="font-display text-xl font-bold">{profile.displayName}</h2>
						<p className="text-sm text-muted-foreground flex items-center gap-1.5">
							{age} yrs • {profile.gender} • {profile.religion}
							{profile.location && <><MapPinIcon className="size-3" /> {profile.location}</>}
						</p>
						<div className="flex gap-1.5 mt-1.5">
							{profile.createdBy !== "self" && <Badge className="bg-amber-500/10 text-amber-500 text-xs">Created by {profile.createdBy}</Badge>}
							{profile.isVerified && <Badge className="bg-emerald-500/10 text-emerald-500 text-xs">Verified</Badge>}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* About */}
			{(profile.aboutMe || profile.lookingFor) && (
				<Card>
					<CardContent className="pt-6 space-y-3">
						{profile.aboutMe && <div><p className="text-xs text-muted-foreground font-medium uppercase">About Me</p><p className="text-sm mt-1">{profile.aboutMe}</p></div>}
						{profile.lookingFor && <div><p className="text-xs text-muted-foreground font-medium uppercase">Looking For</p><p className="text-sm mt-1">{profile.lookingFor}</p></div>}
					</CardContent>
				</Card>
			)}

			{/* Detail sections */}
			{sections.map((section) => (
				<Card key={section.title}>
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-base">
							<section.icon className="size-4 text-primary" />
							{section.title}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-3">
							{section.items.map((item) => (
								<div key={item.label}>
									<p className="text-xs text-muted-foreground">{item.label}</p>
									<p className="text-sm font-medium">{item.value}</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
