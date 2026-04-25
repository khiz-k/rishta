"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { PageHeader } from "@shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	BookmarkIcon,
	BriefcaseIcon,
	GraduationCapIcon,
	HeartIcon,
	LockIcon,
	MapPinIcon,
	RulerIcon,
	SparklesIcon,
} from "lucide-react";
import Link from "next/link";

function calcAge(dob: string): number {
	const birth = new Date(dob);
	const today = new Date();
	let age = today.getFullYear() - birth.getFullYear();
	if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
	return age;
}

function avatarGradient(name: string): string {
	const gradients = [
		"from-rose-400 to-pink-600",
		"from-violet-400 to-purple-600",
		"from-amber-400 to-orange-600",
		"from-emerald-400 to-teal-600",
		"from-blue-400 to-indigo-600",
		"from-fuchsia-400 to-pink-600",
		"from-red-400 to-rose-600",
		"from-cyan-400 to-blue-600",
	];
	return gradients[name.charCodeAt(0) % gradients.length]!;
}

function ProfileCardSkeleton() {
	return (
		<Card>
			<CardContent className="pt-0 p-0">
				<div className="h-28 bg-muted animate-pulse rounded-t-lg" />
				<div className="p-5 space-y-3">
					<div className="h-5 w-32 bg-muted rounded animate-pulse" />
					<div className="h-4 w-48 bg-muted rounded animate-pulse" />
					<div className="h-12 w-full bg-muted rounded animate-pulse" />
				</div>
			</CardContent>
		</Card>
	);
}

export default function HomePage() {
	const queryClient = useQueryClient();

	const { data: profiles = [], isLoading } = useQuery(
		orpc.profiles.browse.queryOptions({ input: {} }),
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
		return (
			<div className="space-y-6">
				<PageHeader title="Discover" subtitle="Finding your perfect match..." />
				<div className="grid gap-5 sm:grid-cols-2">
					{[...Array(4)].map((_, i) => <ProfileCardSkeleton key={i} />)}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader title="Discover" subtitle={`${profiles.length} profiles available · Rishta Aaya Hai ✨`} />

			{profiles.length > 0 ? (
				<div className="grid gap-5 sm:grid-cols-2">
					{profiles.map((p) => {
						const age = calcAge(p.dateOfBirth);
						const grad = avatarGradient(p.displayName);

						return (
							<Card key={p.id} className="overflow-hidden group transition-all duration-300 hover:shadow-lg hover:border-primary/20">
								<div className={`relative h-28 bg-gradient-to-br ${grad}`}>
									<div className="absolute -bottom-8 left-5">
										<div className="size-16 rounded-full bg-background border-4 border-background flex items-center justify-center">
											<span className="font-display text-2xl font-bold text-primary">{p.displayName.charAt(0)}</span>
										</div>
									</div>
									<div className="absolute top-3 right-3 flex gap-1.5">
										<button
											type="button"
											onClick={(e) => { e.preventDefault(); shortlistMutation.mutate({ profileUserId: p.userId }); }}
											className="size-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors"
										>
											<BookmarkIcon className="size-4 text-white" />
										</button>
									</div>
									{p.isVerified && (
										<Badge className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white text-xs border-0">✓ Verified</Badge>
									)}
								</div>

								<CardContent className="pt-10 pb-4">
									<Link href={`/browse/${p.userId}`} className="block">
										<div className="flex items-start justify-between">
											<div>
												<h3 className="font-display text-lg font-semibold group-hover:text-primary transition-colors">{p.displayName}</h3>
												<p className="text-sm text-muted-foreground">{age} yrs · {p.religion} · {p.community || ""}</p>
											</div>
											{p.createdBy !== "self" && (
												<Badge className="bg-amber-500/10 text-amber-500 text-xs shrink-0">👨‍👩‍👧 Family</Badge>
											)}
										</div>

										<div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
											{p.location && <span className="flex items-center gap-1.5"><MapPinIcon className="size-3.5 text-primary/60" />{p.location}</span>}
											{p.profession && <span className="flex items-center gap-1.5"><BriefcaseIcon className="size-3.5 text-primary/60" />{p.profession}</span>}
											{p.education && <span className="flex items-center gap-1.5"><GraduationCapIcon className="size-3.5 text-primary/60" />{p.education}</span>}
											{p.height && <span className="flex items-center gap-1.5"><RulerIcon className="size-3.5 text-primary/60" />{p.height} cm</span>}
										</div>

										{p.aboutMe && (
											<p className="mt-3 text-sm text-muted-foreground line-clamp-2 italic">"{p.aboutMe}"</p>
										)}

										<div className="flex flex-wrap gap-1.5 mt-3">
											{p.diet && <Badge className="bg-muted text-muted-foreground text-xs">{p.diet.replace(/_/g, " ")}</Badge>}
											{p.motherTongue && <Badge className="bg-muted text-muted-foreground text-xs">{p.motherTongue}</Badge>}
										</div>
									</Link>

									<div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
										<Button size="sm" className="flex-1" onClick={() => interestMutation.mutate({ toUserId: p.userId })} loading={interestMutation.isPending}>
											<HeartIcon className="size-3.5 mr-1" /> Send Interest
										</Button>
										<Link href={`/browse/${p.userId}`} className="flex-1">
											<Button size="sm" variant="outline" className="w-full">View Biodata</Button>
										</Link>
									</div>

									<p className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
										<LockIcon className="size-2.5" /> Contact revealed on mutual match
									</p>
								</CardContent>
							</Card>
						);
					})}
				</div>
			) : (
				<Card className="border-dashed border-primary/30">
					<CardContent className="flex flex-col items-center justify-center py-16 text-center">
						<div className="size-16 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center mb-4">
							<SparklesIcon className="size-7 text-primary" />
						</div>
						<p className="font-display font-semibold text-lg">No profiles yet</p>
						<p className="text-sm text-muted-foreground mt-1 max-w-xs">Be one of the first to create a biodata and start discovering matches</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
