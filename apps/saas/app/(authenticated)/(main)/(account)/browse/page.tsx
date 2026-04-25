"use client";

import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent } from "@repo/ui/components/card";
import { PageHeader } from "@shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { HeartIcon, MapPinIcon, GraduationCapIcon, BriefcaseIcon } from "lucide-react";
import Link from "next/link";

function calcAge(dob: string): number {
	const birth = new Date(dob);
	const today = new Date();
	let age = today.getFullYear() - birth.getFullYear();
	if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
	return age;
}

export default function BrowsePage() {
	const { data: profiles = [], isLoading } = useQuery(
		orpc.profiles.browse.queryOptions({ input: {} }),
	);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<PageHeader title="Browse Profiles" subtitle="Find your match" />
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<Card key={i}><CardContent className="pt-6"><div className="h-32 bg-muted rounded animate-pulse" /></CardContent></Card>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader title="Browse Profiles" subtitle={`${profiles.length} profiles available`} />

			{profiles.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{profiles.map((p) => (
						<Link key={p.id} href={`/browse/${p.userId}`} className="group">
							<Card className="h-full transition-all duration-200 hover:border-primary/30 hover:shadow-md">
								<CardContent className="pt-6">
									<div className="flex items-start gap-3">
										<div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-display font-bold text-primary shrink-0">
											{p.displayName.charAt(0)}
										</div>
										<div className="min-w-0">
											<h3 className="font-display font-semibold truncate group-hover:text-primary transition-colors">{p.displayName}</h3>
											<p className="text-sm text-muted-foreground">{calcAge(p.dateOfBirth)} yrs • {p.religion}</p>
										</div>
									</div>

									<div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
										{p.location && <p className="flex items-center gap-1.5"><MapPinIcon className="size-3.5" />{p.location}</p>}
										{p.profession && <p className="flex items-center gap-1.5"><BriefcaseIcon className="size-3.5" />{p.profession}</p>}
										{p.education && <p className="flex items-center gap-1.5"><GraduationCapIcon className="size-3.5" />{p.education}</p>}
									</div>

									<div className="flex gap-1.5 mt-3">
										{p.community && <Badge className="bg-muted text-muted-foreground text-xs">{p.community}</Badge>}
										{p.diet && <Badge className="bg-muted text-muted-foreground text-xs">{p.diet.replace(/_/g, " ")}</Badge>}
										{p.createdBy !== "self" && <Badge className="bg-amber-500/10 text-amber-500 text-xs">By {p.createdBy}</Badge>}
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			) : (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<HeartIcon className="size-8 text-muted-foreground mb-3" />
						<p className="font-medium">No profiles yet</p>
						<p className="text-sm text-muted-foreground mt-1">Be the first to create a biodata!</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
