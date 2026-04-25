"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { PageHeader } from "@shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	BookmarkIcon,
	BriefcaseIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	GraduationCapIcon,
	HeartIcon,
	MapPinIcon,
	RulerIcon,
	UsersIcon,
	XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

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

export default function DiscoverPage() {
	const queryClient = useQueryClient();
	const [currentIndex, setCurrentIndex] = useState(0);
	const [actionFeedback, setActionFeedback] = useState<string | null>(null);

	const { data: profiles = [], isLoading } = useQuery(
		orpc.profiles.browse.queryOptions({ input: {} }),
	);

	const interestMutation = useMutation({
		...orpc.interests.send.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.interests.list.queryKey({ input: { type: "sent" } }) });
			showFeedback("💕 Interest sent!");
			goNext();
		},
	});

	const shortlistMutation = useMutation({
		...orpc.shortlists.toggle.mutationOptions(),
		onSuccess: (data: any) => {
			queryClient.invalidateQueries({ queryKey: orpc.shortlists.list.queryKey({}) });
			showFeedback(data.shortlisted ? "⭐ Shortlisted!" : "Removed from shortlist");
		},
	});

	const showFeedback = (msg: string) => {
		setActionFeedback(msg);
		setTimeout(() => setActionFeedback(null), 1500);
	};

	const goNext = useCallback(() => {
		if (profiles.length > 0) {
			setCurrentIndex((prev) => (prev + 1) % profiles.length);
		}
	}, [profiles.length]);

	const goPrev = useCallback(() => {
		if (profiles.length > 0) {
			setCurrentIndex((prev) => (prev - 1 + profiles.length) % profiles.length);
		}
	}, [profiles.length]);

	const handlePass = () => {
		showFeedback("Passed");
		goNext();
	};

	// Keyboard navigation
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "ArrowRight") goNext();
			if (e.key === "ArrowLeft") goPrev();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [goNext, goPrev]);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh]">
				<div className="w-full max-w-lg space-y-4">
					<div className="h-40 bg-muted rounded-t-xl animate-pulse" />
					<div className="space-y-3 px-6">
						<div className="h-6 w-48 bg-muted rounded animate-pulse" />
						<div className="h-4 w-64 bg-muted rounded animate-pulse" />
						<div className="h-20 bg-muted rounded animate-pulse" />
					</div>
				</div>
			</div>
		);
	}

	if (profiles.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
				<div className="size-20 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center mb-6">
					<HeartIcon className="size-9 text-primary" />
				</div>
				<p className="font-display text-2xl font-bold">No profiles yet</p>
				<p className="text-muted-foreground mt-2 max-w-sm">Be one of the first to create a biodata and start discovering matches</p>
			</div>
		);
	}

	const p = profiles[currentIndex]!;
	const age = calcAge(p.dateOfBirth);
	const grad = avatarGradient(p.displayName);

	return (
		<div className="flex flex-col items-center">
			{/* Counter */}
			<div className="w-full max-w-lg flex items-center justify-between mb-4">
				<p className="text-sm text-muted-foreground">
					<span className="font-display">Discover</span> · <span className="text-foreground font-semibold">{currentIndex + 1}</span> of {profiles.length}
				</p>
				<div className="flex items-center gap-1">
					<button onClick={goPrev} className="size-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors">
						<ChevronLeftIcon className="size-4 text-muted-foreground" />
					</button>
					<button onClick={goNext} className="size-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors">
						<ChevronRightIcon className="size-4 text-muted-foreground" />
					</button>
				</div>
			</div>

			{/* Profile Card */}
			<AnimatePresence mode="wait">
			<motion.div
				key={currentIndex}
				initial={{ opacity: 0, x: 40, scale: 0.98 }}
				animate={{ opacity: 1, x: 0, scale: 1 }}
				exit={{ opacity: 0, x: -40, scale: 0.98 }}
				transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
				className="w-full max-w-lg"
			>
			<Card className="w-full overflow-hidden relative">
				{/* Action feedback overlay */}
				{actionFeedback && (
					<div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
						<p className="font-display text-2xl font-bold">{actionFeedback}</p>
					</div>
				)}

				{/* Gradient Banner */}
				<div className={`relative h-36 bg-gradient-to-br ${grad}`}>
					<div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
						<div className="size-20 rounded-full bg-background border-4 border-background flex items-center justify-center shadow-lg">
							<span className="font-display text-3xl font-bold text-primary">{p.displayName.charAt(0)}</span>
						</div>
					</div>
					{p.isVerified && (
						<Badge className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white text-xs border-0">✓ Verified</Badge>
					)}
					{p.createdBy !== "self" && (
						<Badge className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white text-xs border-0">👨‍👩‍👧 By {p.createdBy}</Badge>
					)}
				</div>

				{/* Name + basics */}
				<CardContent className="pt-12 text-center">
					<h2 className="font-display text-2xl font-bold">{p.displayName}</h2>
					<p className="text-muted-foreground mt-1">{age} years · {p.religion}{p.community ? ` · ${p.community}` : ""}</p>

					{/* Key details row */}
					<div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-sm text-muted-foreground">
						{p.location && <span className="flex items-center gap-1"><MapPinIcon className="size-3.5 text-primary/70" />{p.location}</span>}
						{p.height && <span className="flex items-center gap-1"><RulerIcon className="size-3.5 text-primary/70" />{p.height} cm</span>}
					</div>
				</CardContent>

				{/* About */}
				{p.aboutMe && (
					<CardContent className="pt-0">
						<div className="rounded-xl bg-accent/50 p-4">
							<p className="text-sm italic text-foreground/80">"{p.aboutMe}"</p>
						</div>
					</CardContent>
				)}

				{/* Looking for */}
				{p.lookingFor && (
					<CardContent className="pt-0">
						<p className="text-xs text-muted-foreground font-medium uppercase mb-1">Looking for</p>
						<p className="text-sm text-muted-foreground">{p.lookingFor}</p>
					</CardContent>
				)}

				{/* Details grid */}
				<CardContent className="pt-0">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-3">
							<div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase"><BriefcaseIcon className="size-3 text-primary/60" /> Career</div>
							{p.profession && <p className="text-sm">{p.profession}</p>}
							{p.employer && <p className="text-xs text-muted-foreground">at {p.employer}</p>}
							{p.education && <p className="text-sm flex items-center gap-1.5"><GraduationCapIcon className="size-3.5 text-primary/60" />{p.education}</p>}
						</div>
						<div className="space-y-3">
							<div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase"><UsersIcon className="size-3 text-primary/60" /> Family</div>
							{p.familyType && <p className="text-sm">{p.familyType} family</p>}
							{p.siblings && <p className="text-xs text-muted-foreground">{p.siblings}</p>}
						</div>
					</div>
				</CardContent>

				{/* Tags */}
				<CardContent className="pt-0">
					<div className="flex flex-wrap gap-1.5">
						{p.diet && <Badge className="bg-muted text-muted-foreground text-xs">{p.diet.replace(/_/g, " ")}</Badge>}
						{p.motherTongue && <Badge className="bg-muted text-muted-foreground text-xs">{p.motherTongue}</Badge>}
						{p.smoking !== "never" && <Badge className="bg-muted text-muted-foreground text-xs">Smokes: {p.smoking}</Badge>}
						{p.drinking !== "never" && <Badge className="bg-muted text-muted-foreground text-xs">Drinks: {p.drinking}</Badge>}
						{p.maritalStatus !== "never_married" && <Badge className="bg-amber-500/10 text-amber-500 text-xs">{p.maritalStatus.replace(/_/g, " ")}</Badge>}
					</div>
				</CardContent>

				{/* Action Buttons */}
				<CardContent className="pt-2 pb-6">
					<div className="flex items-center justify-center gap-4">
						{/* Pass */}
						<button
							type="button"
							onClick={handlePass}
							className="size-14 rounded-full border-2 border-muted-foreground/20 flex items-center justify-center hover:border-rose-500 hover:bg-rose-500/10 transition-all"
						>
							<XIcon className="size-6 text-muted-foreground" />
						</button>

						{/* Shortlist */}
						<button
							type="button"
							onClick={() => shortlistMutation.mutate({ profileUserId: p.userId })}
							className="size-12 rounded-full border-2 border-amber-500/30 flex items-center justify-center hover:border-amber-500 hover:bg-amber-500/10 transition-all"
						>
							<BookmarkIcon className="size-5 text-amber-500" />
						</button>

						{/* Send Interest */}
						<button
							type="button"
							onClick={() => interestMutation.mutate({ toUserId: p.userId })}
							className="size-16 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
						>
							<HeartIcon className="size-7 text-primary-foreground" />
						</button>
					</div>

					<p className="text-center text-xs text-muted-foreground mt-3">
						← → to browse · tap ❤️ to connect
					</p>
				</CardContent>
			</Card>
			</motion.div>
			</AnimatePresence>
		</div>
	);
}
