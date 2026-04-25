"use client";

import { Card, CardContent } from "@repo/ui/components/card";
import { PageHeader } from "@shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { MessageCircleIcon } from "lucide-react";
import Link from "next/link";

export default function MessagesPage() {
	const { data: matches = [], isLoading } = useQuery(orpc.interests.matches.queryOptions({}));

	if (isLoading) {
		return (
			<div className="space-y-6">
				<PageHeader title="Messages" subtitle="Loading..." />
				<div className="space-y-3">{[...Array(3)].map((_, i) => <Card key={i}><CardContent className="pt-6"><div className="h-14 bg-muted rounded animate-pulse" /></CardContent></Card>)}</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-lg mx-auto">
			<PageHeader title="Messages" subtitle={`${matches.length} conversations`} />

			{matches.length > 0 ? (
				<div className="space-y-2">
					{matches.map((m: any) => (
						<Link key={m.userId} href={`/matches/${m.userId}`}>
							<Card className="hover:border-primary/20 transition-all cursor-pointer">
								<CardContent className="py-3 flex items-center gap-3">
									<div className="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
										{m.profilePhoto ? (
											<img src={m.profilePhoto} alt={m.displayName} className="size-full object-cover" />
										) : (
											<span className="font-display font-bold text-primary">{m.displayName?.charAt(0)}</span>
										)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="font-display font-semibold text-sm">{m.displayName}</p>
										<p className="text-xs text-muted-foreground truncate">Tap to start chatting</p>
									</div>
									<MessageCircleIcon className="size-4 text-muted-foreground/40 shrink-0" />
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			) : (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<MessageCircleIcon className="size-8 text-muted-foreground mb-3" />
						<p className="font-medium">No conversations yet</p>
						<p className="text-sm text-muted-foreground mt-1">Match with someone to start chatting</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
