"use client";

import { useSession } from "@auth/hooks/use-session";
import { Card, CardContent } from "@repo/ui/components/card";
import { Progress } from "@repo/ui/components/progress";
import { PageHeader } from "@shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightIcon, HeartIcon, LockIcon } from "lucide-react";
import Link from "next/link";

function calcCompleteness(profile: Record<string, unknown> | null | undefined): number {
	if (!profile) return 0;
	const fields = [
		"displayName", "gender", "dateOfBirth", "height", "religion", "community",
		"motherTongue", "education", "profession", "location", "aboutMe", "lookingFor", "profilePhoto",
	];
	return Math.round((fields.filter((f) => profile[f]).length / fields.length) * 100);
}

export default function ActivityPage() {
	const { user } = useSession();

	const { data: profile, isLoading: pLoading } = useQuery(orpc.profiles.me.queryOptions({}));
	const { data: received = [], isLoading: rLoading } = useQuery(orpc.interests.list.queryOptions({ input: { type: "received" } }));
	const { data: sent = [], isLoading: sLoading } = useQuery(orpc.interests.list.queryOptions({ input: { type: "sent" } }));
	const { data: matches = [], isLoading: mLoading } = useQuery(orpc.interests.matches.queryOptions({}));

	const isLoading = pLoading || rLoading || sLoading || mLoading;
	const completeness = calcCompleteness(profile);
	const pending = received.filter((i: any) => i.status === "pending");

	if (isLoading) {
		return (
			<div className="space-y-6">
				<PageHeader title="Activity" subtitle="Loading..." />
				<div className="grid gap-4 sm:grid-cols-2">{[...Array(4)].map((_, i) => <Card key={i}><CardContent className="pt-6"><div className="h-16 bg-muted rounded animate-pulse" /></CardContent></Card>)}</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<PageHeader title="Activity" subtitle={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`} />

			{/* Profile Completeness */}
			<Card className="relative overflow-hidden">
				<div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-rose-500/80 to-pink-500/20" />
				<CardContent className="pt-6">
					<div className="flex items-center justify-between mb-3">
						<div>
							<p className="font-display font-semibold">Your Biodata</p>
							<p className="text-sm text-muted-foreground">
								{completeness === 0 ? "Start building your profile" : completeness < 70 ? "Complete your biodata to attract more interests" : completeness < 100 ? "Almost there!" : "Your profile is complete 🎉"}
							</p>
						</div>
						<span className="font-display text-2xl font-bold text-primary">{completeness}%</span>
					</div>
					<Progress value={completeness} className="h-2" />
					{completeness < 100 && (
						<Link href="/profile/edit" className="inline-flex items-center gap-1 text-sm text-primary mt-3 hover:underline">
							{completeness === 0 ? "Create your biodata" : "Complete your profile"} <ArrowRightIcon className="size-3.5" />
						</Link>
					)}
				</CardContent>
			</Card>

			{/* Stats Grid */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card className="relative overflow-hidden">
					<div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-pink-500/80 to-pink-500/20" />
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">Pending Interests</p>
						<p className="font-display text-3xl font-bold tracking-tight mt-1">{pending.length}</p>
						<p className="text-xs text-muted-foreground mt-1">waiting for your response</p>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden">
					<div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-rose-500/80 to-rose-500/20" />
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">Interests Sent</p>
						<p className="font-display text-3xl font-bold tracking-tight mt-1">{sent.length}</p>
						<p className="text-xs text-muted-foreground mt-1">awaiting their response</p>
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

				<Card className="relative overflow-hidden">
					<div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500/80 to-amber-500/20" />
					<CardContent className="pt-6">
						<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
							<LockIcon className="size-3" /> Privacy
						</div>
						<p className="font-display text-lg font-semibold tracking-tight mt-1">Contact hidden</p>
						<p className="text-xs text-muted-foreground mt-1">revealed on mutual match</p>
					</CardContent>
				</Card>
			</div>

			{/* CTA if no profile */}
			{!profile && (
				<Card className="border-dashed border-primary/30">
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<div className="size-16 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center mb-4">
							<HeartIcon className="size-7 text-primary" />
						</div>
						<p className="font-display font-semibold text-lg">Your rishta is waiting</p>
						<p className="text-sm text-muted-foreground mt-1 mb-4 max-w-xs">Create your biodata to start getting discovered</p>
						<Link href="/profile/edit" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
							Create Biodata <ArrowRightIcon className="size-3.5" />
						</Link>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
