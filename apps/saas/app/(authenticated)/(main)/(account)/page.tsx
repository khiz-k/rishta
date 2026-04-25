"use client";

import { useSession } from "@auth/hooks/use-session";
import { Card, CardContent } from "@repo/ui/components/card";
import { Progress } from "@repo/ui/components/progress";
import { PageHeader } from "@shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowRightIcon,
	BookmarkIcon,
	HeartIcon,
	LockIcon,
	SearchIcon,
	SlidersHorizontalIcon,
	SparklesIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";

function calcCompleteness(profile: Record<string, unknown> | null | undefined): number {
	if (!profile) return 0;
	const fields = [
		"displayName", "gender", "dateOfBirth", "height", "religion", "community",
		"motherTongue", "education", "profession", "location", "aboutMe", "lookingFor", "profilePhoto",
	];
	const filled = fields.filter((f) => profile[f]).length;
	return Math.round((filled / fields.length) * 100);
}

function DashboardSkeleton() {
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

	if (isLoading) return <DashboardSkeleton />;

	const completeness = calcCompleteness(profile);
	const pendingInterests = receivedInterests.filter((i: any) => i.status === "pending");

	const quickActions = [
		{ href: "/browse", icon: SearchIcon, label: "Browse Profiles", desc: "Find your match", color: "text-rose-500", bg: "bg-rose-500/10" },
		{ href: "/interests", icon: HeartIcon, label: "Interests", desc: `${pendingInterests.length} new`, color: "text-pink-500", bg: "bg-pink-500/10" },
		{ href: "/matches", icon: SparklesIcon, label: "Matches", desc: `${matches.length} connections`, color: "text-violet-500", bg: "bg-violet-500/10" },
		{ href: "/shortlist", icon: BookmarkIcon, label: "Shortlist", desc: "Saved profiles", color: "text-blue-500", bg: "bg-blue-500/10" },
		{ href: "/preferences", icon: SlidersHorizontalIcon, label: "Preferences", desc: "Match filters", color: "text-amber-500", bg: "bg-amber-500/10" },
	];

	return (
		<div className="space-y-10">
			<PageHeader
				title={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
				subtitle="Rishta Aaya Hai ✨"
			/>

			{/* Profile Completeness */}
			<Card className="relative overflow-hidden">
				<div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-rose-500/80 to-pink-500/20" />
				<CardContent className="pt-6">
					<div className="flex items-center justify-between mb-3">
						<div>
							<p className="font-display font-semibold">Your Biodata</p>
							<p className="text-sm text-muted-foreground">
								{completeness === 0 ? "Start building your profile" : completeness < 70 ? "Complete your biodata to attract more interests" : completeness < 100 ? "Almost there! A few more details" : "Your profile is complete 🎉"}
							</p>
						</div>
						<span className="font-display text-2xl font-bold text-primary">{completeness}%</span>
					</div>
					<Progress value={completeness} className="h-2" />
					{completeness < 100 && (
						<Link href={profile ? "/profile/edit" : "/profile/edit"} className="inline-flex items-center gap-1 text-sm text-primary mt-3 hover:underline">
							{completeness === 0 ? "Create your biodata" : "Complete your profile"} <ArrowRightIcon className="size-3.5" />
						</Link>
					)}
				</CardContent>
			</Card>

			{/* Stats */}
			<div className="grid gap-4 sm:grid-cols-3">
				<Card className="relative overflow-hidden">
					<div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-pink-500/80 to-pink-500/20" />
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">New Interests</p>
						<p className="font-display text-3xl font-bold tracking-tight mt-1">{pendingInterests.length}</p>
						<p className="text-xs text-muted-foreground mt-1">
							{pendingInterests.length > 0 ? "people want to connect with you" : "share your profile to get noticed"}
						</p>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden">
					<div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-violet-500/80 to-violet-500/20" />
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">Matches</p>
						<p className="font-display text-3xl font-bold tracking-tight mt-1">{matches.length}</p>
						<p className="text-xs text-muted-foreground mt-1">
							{matches.length > 0 ? "mutual connections — contact revealed" : "when both sides accept, you connect"}
						</p>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden">
					<div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500/80 to-amber-500/20" />
					<CardContent className="pt-6">
						<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
							<LockIcon className="size-3" /> Privacy
						</div>
						<p className="font-display text-lg font-semibold tracking-tight mt-1">Contact hidden</p>
						<p className="text-xs text-muted-foreground mt-1">email only revealed on mutual match</p>
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
						<div className="size-16 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center mb-4">
							<HeartIcon className="size-7 text-primary" />
						</div>
						<p className="font-display font-semibold text-lg">Your rishta is waiting</p>
						<p className="text-sm text-muted-foreground mt-1 mb-4 max-w-xs">Create your biodata to start getting discovered by compatible matches</p>
						<Link
							href="/profile/edit"
							className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
						>
							Create Biodata <ArrowRightIcon className="size-3.5" />
						</Link>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
