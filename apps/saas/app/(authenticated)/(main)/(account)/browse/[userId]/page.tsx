"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { PageHeader } from "@shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, BookmarkIcon, HeartIcon, MapPinIcon, GraduationCapIcon, BriefcaseIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

function calcAge(dob: string): number {
	const birth = new Date(dob);
	const today = new Date();
	let age = today.getFullYear() - birth.getFullYear();
	if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
	return age;
}

export default function ProfileDetailPage() {
	const params = useParams<{ userId: string }>();
	const queryClient = useQueryClient();

	const { data: profile, isLoading } = useQuery(
		orpc.profiles.get.queryOptions({ input: { userId: params.userId } }),
	);

	const interestMutation = useMutation({
		...orpc.interests.send.mutationOptions(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.interests.list.queryKey({ input: { type: "sent" } }) }),
	});

	const shortlistMutation = useMutation({
		...orpc.shortlists.toggle.mutationOptions(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.shortlists.list.queryKey({}) }),
	});

	if (isLoading) {
		return <div className="space-y-4">{[...Array(4)].map((_, i) => <Card key={i}><CardContent className="pt-6"><div className="h-16 bg-muted rounded animate-pulse" /></CardContent></Card>)}</div>;
	}

	if (!profile) {
		return <div className="text-center py-12 text-muted-foreground">Profile not found</div>;
	}

	const age = calcAge(profile.dateOfBirth);

	return (
		<div className="space-y-6 max-w-2xl">
			<Link href="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
				<ArrowLeftIcon className="size-3.5" /> Back to browse
			</Link>

			{/* Header */}
			<Card className="relative overflow-hidden">
				<div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-rose-500/80 to-pink-500/20" />
				<CardContent className="pt-6">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-4">
							<div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-display font-bold text-primary">
								{profile.displayName.charAt(0)}
							</div>
							<div>
								<h2 className="font-display text-xl font-bold">{profile.displayName}</h2>
								<p className="text-sm text-muted-foreground">
									{age} yrs • {profile.gender} • {profile.religion}
									{profile.location && <span className="ml-1.5"><MapPinIcon className="size-3 inline" /> {profile.location}</span>}
								</p>
								<div className="flex gap-1.5 mt-1.5">
									{profile.community && <Badge className="bg-muted text-muted-foreground text-xs">{profile.community}</Badge>}
									{profile.createdBy !== "self" && <Badge className="bg-amber-500/10 text-amber-500 text-xs">Created by {profile.createdBy}</Badge>}
								</div>
							</div>
						</div>
					</div>

					<div className="flex gap-2 mt-4">
						<Button
							onClick={() => interestMutation.mutate({ toUserId: params.userId })}
							loading={interestMutation.isPending}
							className="flex-1"
						>
							<HeartIcon className="size-4 mr-1" /> Send Interest
						</Button>
						<Button
							variant="outline"
							onClick={() => shortlistMutation.mutate({ profileUserId: params.userId })}
							loading={shortlistMutation.isPending}
						>
							<BookmarkIcon className="size-4 mr-1" /> Shortlist
						</Button>
					</div>

					{interestMutation.isSuccess && (
						<p className="text-sm text-emerald-500 mt-2">✅ Interest sent!</p>
					)}
				</CardContent>
			</Card>

			{/* About */}
			{(profile.aboutMe || profile.lookingFor) && (
				<Card>
					<CardContent className="pt-6 space-y-3">
						{profile.aboutMe && <div><p className="text-xs text-muted-foreground font-medium uppercase">About</p><p className="text-sm mt-1">{profile.aboutMe}</p></div>}
						{profile.lookingFor && <div><p className="text-xs text-muted-foreground font-medium uppercase">Looking For</p><p className="text-sm mt-1">{profile.lookingFor}</p></div>}
					</CardContent>
				</Card>
			)}

			{/* Details */}
			<Card>
				<CardHeader><CardTitle className="flex items-center gap-2 text-base"><HeartIcon className="size-4 text-primary" />Basic Info</CardTitle></CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div><p className="text-xs text-muted-foreground">Height</p><p className="font-medium">{profile.height ? `${profile.height} cm` : "—"}</p></div>
						<div><p className="text-xs text-muted-foreground">Marital Status</p><p className="font-medium">{profile.maritalStatus.replace(/_/g, " ")}</p></div>
						<div><p className="text-xs text-muted-foreground">Mother Tongue</p><p className="font-medium">{profile.motherTongue || "—"}</p></div>
						<div><p className="text-xs text-muted-foreground">Diet</p><p className="font-medium">{profile.diet.replace(/_/g, " ")}</p></div>
						<div><p className="text-xs text-muted-foreground">Smoking</p><p className="font-medium">{profile.smoking}</p></div>
						<div><p className="text-xs text-muted-foreground">Drinking</p><p className="font-medium">{profile.drinking}</p></div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle className="flex items-center gap-2 text-base"><GraduationCapIcon className="size-4 text-primary" />Education & Career</CardTitle></CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div><p className="text-xs text-muted-foreground">Education</p><p className="font-medium">{profile.education || "—"}</p></div>
						<div><p className="text-xs text-muted-foreground">University</p><p className="font-medium">{profile.university || "—"}</p></div>
						<div><p className="text-xs text-muted-foreground">Profession</p><p className="font-medium">{profile.profession || "—"}</p></div>
						<div><p className="text-xs text-muted-foreground">Employer</p><p className="font-medium">{profile.employer || "—"}</p></div>
						<div><p className="text-xs text-muted-foreground">Income</p><p className="font-medium">{profile.incomeRange?.replace(/_/g, " ") || "—"}</p></div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle className="flex items-center gap-2 text-base"><UsersIcon className="size-4 text-primary" />Family</CardTitle></CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div><p className="text-xs text-muted-foreground">Family Type</p><p className="font-medium">{profile.familyType || "—"}</p></div>
						<div><p className="text-xs text-muted-foreground">Siblings</p><p className="font-medium">{profile.siblings || "—"}</p></div>
						<div><p className="text-xs text-muted-foreground">Father's Occupation</p><p className="font-medium">{profile.fatherOccupation || "—"}</p></div>
						<div><p className="text-xs text-muted-foreground">Mother's Occupation</p><p className="font-medium">{profile.motherOccupation || "—"}</p></div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
