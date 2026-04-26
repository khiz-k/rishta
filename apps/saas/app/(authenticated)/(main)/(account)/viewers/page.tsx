"use client";

import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent } from "@repo/ui/components/card";
import { PageHeader } from "@shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { calcAge } from "@shared/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { EyeIcon, MapPinIcon } from "lucide-react";
import Link from "next/link";

export default function ViewersPage() {
	const { data: viewers = [], isLoading } = useQuery(orpc.profiles.viewers.queryOptions({}));

	if (isLoading) {
		return (
			<div className="space-y-6 max-w-lg mx-auto">
				<PageHeader title="Who Viewed Me" subtitle="Loading..." />
				<div className="space-y-3">{[...Array(3)].map((_, i) => <Card key={i}><CardContent className="pt-6"><div className="h-14 bg-muted rounded animate-pulse" /></CardContent></Card>)}</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-lg mx-auto">
			<PageHeader title="Who Viewed Me" subtitle={`${viewers.length} people viewed your profile`} />

			{viewers.length > 0 ? (
				<div className="space-y-2">
					{viewers.map((v: any) => (
						<Link key={v.id} href={`/browse/${v.viewerUserId}`}>
							<Card className="hover:border-primary/20 transition-all cursor-pointer">
								<CardContent className="py-3 flex items-center gap-3">
									<div className="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
										{v.profile?.profilePhoto ? (
											<img src={v.profile.profilePhoto} alt="" className="size-full object-cover" />
										) : (
											<span className="font-display font-bold text-primary">{v.profile?.displayName?.charAt(0) || "?"}</span>
										)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="font-display font-semibold text-sm">{v.profile?.displayName || "Someone"}</p>
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											{v.profile?.dateOfBirth && <span>{calcAge(v.profile.dateOfBirth)} yrs</span>}
											{v.profile?.location && <span className="flex items-center gap-0.5"><MapPinIcon className="size-3" />{v.profile.location}</span>}
										</div>
									</div>
									<div className="text-xs text-muted-foreground">
										{new Date(v.createdAt).toLocaleDateString()}
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			) : (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<EyeIcon className="size-8 text-muted-foreground mb-3" />
						<p className="font-medium">No views yet</p>
						<p className="text-sm text-muted-foreground mt-1">As people discover you, you'll see who viewed your profile here</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
