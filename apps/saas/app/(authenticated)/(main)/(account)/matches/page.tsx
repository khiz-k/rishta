"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { PageHeader } from "@shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { MailIcon, MapPinIcon, MessageCircleIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";

function calcAge(dob: string): number {
	const birth = new Date(dob);
	const today = new Date();
	let age = today.getFullYear() - birth.getFullYear();
	if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
	return age;
}

export default function MatchesPage() {
	const { data: matches = [], isLoading } = useQuery(orpc.interests.matches.queryOptions({}));

	if (isLoading) {
		return (
			<div className="space-y-6">
				<PageHeader title="Matches" subtitle="Loading..." />
				<div className="space-y-3">{[...Array(3)].map((_, i) => <Card key={i}><CardContent className="pt-6"><div className="h-20 bg-muted rounded animate-pulse" /></CardContent></Card>)}</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader title="Matches" subtitle={`${matches.length} mutual connections`} />

			{matches.length > 0 ? (
				<div className="space-y-3">
					{matches.map((m: any) => (
						<Card key={m.id} className="relative overflow-hidden">
							<div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-violet-500/80 to-pink-500/20" />
							<CardContent className="py-4">
								<div className="flex items-start justify-between">
									<Link href={`/browse/${m.userId}`} className="flex items-center gap-3 min-w-0">
										<div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-display font-bold text-primary shrink-0">
											{m.displayName.charAt(0)}
										</div>
										<div>
											<h3 className="font-display font-semibold">{m.displayName}</h3>
											<p className="text-sm text-muted-foreground">{calcAge(m.dateOfBirth)} yrs • {m.religion}</p>
											{m.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPinIcon className="size-3" />{m.location}</p>}
										</div>
									</Link>
									<Badge className="bg-violet-500/10 text-violet-500 text-xs shrink-0">
										<SparklesIcon className="size-3 mr-1" /> Matched
									</Badge>
								</div>

								{/* Contact + Chat */}
								<div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
									<div>
										<div className="flex items-center gap-2 text-sm">
											<MailIcon className="size-3.5 text-primary" />
											<span>{m.contactEmail}</span>
										</div>
									</div>
									<Link href={`/matches/${m.userId}`}>
										<Button size="sm" variant="outline" className="gap-1.5">
											<MessageCircleIcon className="size-3.5" /> Chat
										</Button>
									</Link>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<SparklesIcon className="size-8 text-muted-foreground mb-3" />
						<p className="font-medium">No matches yet</p>
						<p className="text-sm text-muted-foreground mt-1">When you and someone both accept each other's interest, you'll see them here with their contact info</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
