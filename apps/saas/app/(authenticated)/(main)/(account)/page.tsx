"use client";

import { useSession } from "@auth/hooks/use-session";
import { Card, CardContent } from "@repo/ui/components/card";
import { PageHeader } from "@shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowRightIcon,
	BookmarkIcon,
	HeartIcon,
	SearchIcon,
	SparklesIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";

function ProfileCompleteness({ profile }: { profile: Record<string, unknown> | null | undefined }) {
	if (!profile) return 0;
	const fields = [
		"displayName", "gender", "dateOfBirth", "height", "religion", "community",
		"motherTongue", "education", "profession", "location", "aboutMe", "lookingFor", "profilePhoto",
	];
	const filled = fields.filter((f) => profile[f]).length;
	return Math.round((filled / fields.length) * 100);
}

export default function DashboardPage() {
	const { user } = useSession();

	const { data: profile, isLoading: profileLoading } = useQuery(
		orpc.profiles.me.queryOptions({}),
	);

	const { data: receivedInterests = [], isLoading: interestsLoading } = useQuery(
		orpc.interests.list.queryOptions({ input: { type: "received" } }),
	);

	const { data: matches = [], isLoading: matchesLoading } = useQuery(
		orpc.interests.matches.queryOptions({}),
	);

	const isLoading = profileLoading || interestsLoading || matchesLoading;
	const completeness = ProfileCompleteness({ profile });
	const pendingInterests = receivedInterests.filter((i: any) => i.status === "pending");

	if (isLoading) {
		return (
			<div className="space-y-10">
				<PageHeader title="Welcome back" subtitle="Loading..." />
				<div className="grid gap-4 sm:grid-cols-3">
					{[...Array(3)].map((_, i) => (
						<Card key={i}>
							<CardContent className="pt-6 space-y-2">
								<div className="h-4 w-16 bg-muted rounded animate-pulse" />
								<div className="h-8 w-12 bg-muted rounded animate-pulse" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	const quickActions = [
		{ href: "/browse", icon: SearchIcon, label: "Browse Profiles", desc: "Find your match", color: "text-rose-500", bg: "bg-rose-500/10" },
		{ href: "/profile", icon: UserIcon, label: "My Biodata", desc: `${completeness}% complete`, color: "text-amber-500", bg: "bg-amber-500/10" },
		{ href: "/interests", icon: HeartIcon, label: "Interests", desc: `${pendingInterests.length} new`, color: "text-pink-500", bg: "bg-pink-500/10" },
		{ href: "/matches", icon: SparklesIcon, label: "Matches", desc: `${matches.length} matches`, color: "text-violet-500", bg: "bg-violet-500/10" },
		{ href: "/shortlist", icon: BookmarkIcon, label: "Shortlist", desc: "Saved profiles", color: "text-blue-500", bg: "bg-blue-500/10" },
	];

	return (
		<div className="space-y-10">
			<PageHeader title={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`} subtitle="Rishta Aaya Hai ✨" />

			{/* Stats */}
			<div className="grid gap-4 sm:grid-cols-3">
				<Card className="relative overflow-hidden">
					<div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-rose-500/80 to-rose-500/20" />
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">Profile</p>
						<p className="font-display text-3xl font-bold tracking-tight mt-1">{completeness}%</p>
						<p className="text-xs text-muted-foreground mt-1">completeness</p>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden">
					<div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-pink-500/80 to-pink-500/20" />
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">New Interests</p>
						<p className="font-display text-3xl font-bold tracking-tight mt-1">{pendingInterests.length}</p>
						<p className="text-xs text-muted-foreground mt-1">waiting for you</p>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden">
					<div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-violet-500/80 to-violet-500/20" />
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">Matches</p>
						<p className="font-display text-3xl font-bold tracking-tight mt-1">{matches.length}</p>
						<p className="text-xs text-muted-foreground mt-1">mutual connections</p>
					</CardContent>
				</Card>
			</div>

			{/* Quick Actions */}
			<div>
				<h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
					{quickActions.map((action) => (
						<Link key={action.href} href={action.href} className="group">
							<Card className="h-full transition-all duration-200 hover:border-primary/30 hover:shadow-sm">
								<CardContent className="pt-5 pb-4 flex flex-col gap-3">
									<div className={`size-10 rounded-lg ${action.bg} flex items-center justify-center`}>
										<action.icon className={`size-5 ${action.color}`} />
									</div>
									<div>
										<p className="font-medium text-sm group-hover:text-primary transition-colors">{action.label}</p>
										<p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			</div>

			{/* CTA if no profile */}
			{!profile && (
				<Card className="border-dashed border-primary/30">
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
							<UserIcon className="size-6 text-primary" />
						</div>
						<p className="font-display font-semibold text-lg">Create your biodata</p>
						<p className="text-sm text-muted-foreground mt-1 mb-4">Set up your profile to start receiving interests</p>
						<Link
							href="/profile/edit"
							className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
						>
							Create Profile <ArrowRightIcon className="size-3.5" />
						</Link>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
