"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { PageHeader } from "@shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, HeartIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function calcAge(dob: string): number {
	const birth = new Date(dob);
	const today = new Date();
	let age = today.getFullYear() - birth.getFullYear();
	if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
	return age;
}

export default function InterestsPage() {
	const [tab, setTab] = useState<"received" | "sent">("received");
	const queryClient = useQueryClient();

	const { data: interests = [], isLoading } = useQuery(
		orpc.interests.list.queryOptions({ input: { type: tab } }),
	);

	const respondMutation = useMutation({
		...orpc.interests.respond.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.interests.list.queryKey({ input: { type: "received" } }) });
			queryClient.invalidateQueries({ queryKey: orpc.interests.matches.queryKey({}) });
		},
	});

	return (
		<div className="space-y-6">
			<PageHeader title="Interests" subtitle={tab === "received" ? "People interested in you" : "People you're interested in"} />

			<div className="flex gap-2">
				<Button variant={tab === "received" ? "primary" : "outline"} size="sm" onClick={() => setTab("received")}>Received</Button>
				<Button variant={tab === "sent" ? "primary" : "outline"} size="sm" onClick={() => setTab("sent")}>Sent</Button>
			</div>

			{isLoading ? (
				<div className="space-y-3">{[...Array(3)].map((_, i) => <Card key={i}><CardContent className="pt-6"><div className="h-16 bg-muted rounded animate-pulse" /></CardContent></Card>)}</div>
			) : interests.length > 0 ? (
				<div className="space-y-3">
					{interests.map((item: any) => {
						const p = item.profile;
						if (!p) return null;
						const statusColors: Record<string, string> = {
							pending: "bg-amber-500/10 text-amber-500",
							accepted: "bg-emerald-500/10 text-emerald-500",
							declined: "bg-rose-500/10 text-rose-500",
						};
						return (
							<Card key={item.id} className="transition-all hover:border-primary/20">
								<CardContent className="py-4 flex items-center justify-between">
									<Link href={`/browse/${p.userId}`} className="flex items-center gap-3 min-w-0 flex-1">
										<div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-display font-bold text-primary shrink-0">
											{p.displayName.charAt(0)}
										</div>
										<div className="min-w-0">
											<p className="font-medium truncate">{p.displayName}</p>
											<p className="text-sm text-muted-foreground">{calcAge(p.dateOfBirth)} yrs • {p.religion} • {p.location || "—"}</p>
										</div>
									</Link>
									<div className="flex items-center gap-2 ml-3 shrink-0">
										{item.bidAmount > 0 && (
										<Badge className="bg-amber-500/10 text-amber-500 text-xs gap-1">🔥 {item.bidAmount} credits</Badge>
									)}
									<Badge className={`text-xs ${statusColors[item.status] || ""}`}>{item.status}</Badge>
										{tab === "received" && item.status === "pending" && (
											<>
												<Button size="sm" variant="outline" onClick={() => respondMutation.mutate({ interestId: item.id, action: "accepted" })} loading={respondMutation.isPending}>
													<CheckIcon className="size-3.5 text-emerald-500" />
												</Button>
												<Button size="sm" variant="outline" onClick={() => respondMutation.mutate({ interestId: item.id, action: "declined" })} loading={respondMutation.isPending}>
													<XIcon className="size-3.5 text-rose-500" />
												</Button>
											</>
										)}
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			) : (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<HeartIcon className="size-8 text-muted-foreground mb-3" />
						<p className="font-medium">No {tab} interests yet</p>
						<p className="text-sm text-muted-foreground mt-1">{tab === "received" ? "When someone shows interest, it'll appear here" : "Browse profiles and send interests"}</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
