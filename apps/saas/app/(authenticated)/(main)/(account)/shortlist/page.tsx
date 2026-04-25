"use client";

import { Card, CardContent } from "@repo/ui/components/card";
import { PageHeader } from "@shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { BookmarkIcon, MapPinIcon } from "lucide-react";
import Link from "next/link";

function calcAge(dob: string): number {
	const birth = new Date(dob);
	const today = new Date();
	let age = today.getFullYear() - birth.getFullYear();
	if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
	return age;
}

export default function ShortlistPage() {
	const { data: items = [], isLoading } = useQuery(orpc.shortlists.list.queryOptions({}));

	if (isLoading) {
		return (
			<div className="space-y-6">
				<PageHeader title="Shortlist" subtitle="Loading..." />
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => <Card key={i}><CardContent className="pt-6"><div className="h-24 bg-muted rounded animate-pulse" /></CardContent></Card>)}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader title="Shortlist" subtitle={`${items.length} saved profiles`} />

			{items.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{items.map((item: any) => {
						const p = item.profile;
						if (!p) return null;
						return (
							<Link key={item.id} href={`/browse/${p.userId}`} className="group">
								<Card className="h-full transition-all duration-200 hover:border-primary/30 hover:shadow-md">
									<CardContent className="pt-6">
										<div className="flex items-start gap-3">
											<div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-display font-bold text-primary shrink-0">
												{p.displayName.charAt(0)}
											</div>
											<div className="min-w-0">
												<h3 className="font-medium truncate group-hover:text-primary transition-colors">{p.displayName}</h3>
												<p className="text-sm text-muted-foreground">{calcAge(p.dateOfBirth)} yrs • {p.religion}</p>
												{p.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPinIcon className="size-3" />{p.location}</p>}
											</div>
										</div>
									</CardContent>
								</Card>
							</Link>
						);
					})}
				</div>
			) : (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<BookmarkIcon className="size-8 text-muted-foreground mb-3" />
						<p className="font-medium">No saved profiles</p>
						<p className="text-sm text-muted-foreground mt-1">Bookmark profiles while browsing to save them here</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
