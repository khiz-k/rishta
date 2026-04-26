"use client";

import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent } from "@repo/ui/components/card";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
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
import {
	AnimatePresence,
	motion,
	useMotionValue,
	useTransform,
} from "motion/react";
import { avatarGradient, calcAge, haptic, playSound } from "@shared/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ── Confetti ──

function Confetti({ active }: { active: boolean }) {
	if (!active) return null;
	const pieces = Array.from({ length: 24 }, (_, i) => ({
		id: i,
		x: Math.random() * 100,
		delay: Math.random() * 0.3,
		color: ["#f43f5e", "#ec4899", "#a855f7", "#f59e0b", "#10b981", "#3b82f6"][i % 6],
		rotation: Math.random() * 360,
	}));

	return (
		<div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
			{pieces.map((p) => (
				<motion.div
					key={p.id}
					initial={{ y: "50%", x: `${p.x}%`, opacity: 1, rotate: 0, scale: 1 }}
					animate={{ y: "-100%", opacity: 0, rotate: p.rotation + 360, scale: 0.5 }}
					transition={{ duration: 1.5, delay: p.delay, ease: "easeOut" }}
					className="absolute w-2 h-3 rounded-sm"
					style={{ backgroundColor: p.color, left: `${p.x}%` }}
				/>
			))}
		</div>
	);
}

// ── Skeleton ──

function DiscoverSkeleton() {
	return (
		<div className="flex flex-col items-center">
			<div className="w-full max-w-lg">
				{/* Dot placeholders */}
				<div className="flex items-center justify-center gap-1.5 mb-3">
					{[...Array(8)].map((_, i) => (
						<div key={i} className="h-1 w-1.5 rounded-full bg-muted-foreground/10" />
					))}
				</div>
				<Card className="overflow-hidden">
					{/* Gradient banner skeleton */}
					<div className="h-36 bg-gradient-to-br from-muted to-muted/50 animate-pulse relative">
						<div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
							<div className="size-20 rounded-full bg-background border-4 border-background animate-pulse" />
						</div>
					</div>
					<CardContent className="pt-14 pb-6 space-y-4">
						<div className="flex flex-col items-center gap-2">
							<div className="h-6 w-40 bg-muted rounded animate-pulse" />
							<div className="h-4 w-56 bg-muted rounded animate-pulse" />
						</div>
						<div className="rounded-xl bg-muted/50 h-16 animate-pulse" />
						<div className="grid grid-cols-2 gap-4">
							<div className="h-16 bg-muted rounded animate-pulse" />
							<div className="h-16 bg-muted rounded animate-pulse" />
						</div>
						<div className="flex justify-center gap-4 pt-2">
							<div className="size-14 rounded-full bg-muted animate-pulse" />
							<div className="size-12 rounded-full bg-muted animate-pulse" />
							<div className="size-16 rounded-full bg-muted animate-pulse" />
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

// ── Main Page ──

export default function DiscoverPage() {
	const queryClient = useQueryClient();
	const [currentIndex, setCurrentIndex] = useState(0);
	const [actionFeedback, setActionFeedback] = useState<string | null>(null);
	const [showConfetti, setShowConfetti] = useState(false);
	const [bidAmount, setBidAmount] = useState(0);
	const [showBidSlider, setShowBidSlider] = useState(false);
	const constraintsRef = useRef(null);

	// Drag state
	const dragX = useMotionValue(0);
	const dragRotate = useTransform(dragX, [-200, 0, 200], [-12, 0, 12]);
	const dragOpacity = useTransform(dragX, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);
	const passOverlay = useTransform(dragX, [-200, -80, 0], [1, 0, 0]);
	const likeOverlay = useTransform(dragX, [0, 80, 200], [0, 0, 1]);

	const { data: profiles = [], isLoading } = useQuery(
		orpc.profiles.browse.queryOptions({ input: {} }),
	);

	const { data: myPrefs } = useQuery(orpc.preferences.get.queryOptions({}));
	const { data: myWallet } = useQuery(orpc.wallet.get.queryOptions({}));

	// Calculate compatibility %
	const calcCompatibility = (p: any): number => {
		if (!myPrefs) return 0;
		let score = 0;
		let total = 0;

		if (myPrefs.ageMin || myPrefs.ageMax) {
			total += 1;
			const age = calcAge(p.dateOfBirth);
			if ((!myPrefs.ageMin || age >= myPrefs.ageMin) && (!myPrefs.ageMax || age <= myPrefs.ageMax)) score += 1;
		}
		if (myPrefs.religions) {
			total += 1;
			const prefR = myPrefs.religions.toLowerCase().split(",").map((r: string) => r.trim());
			if (p.religion && prefR.includes(p.religion.toLowerCase())) score += 1;
		}
		if (myPrefs.diet) {
			total += 1;
			const prefD = myPrefs.diet.toLowerCase().split(",").map((d: string) => d.trim());
			if (p.diet && prefD.includes(p.diet.toLowerCase())) score += 1;
		}
		if (myPrefs.locations) {
			total += 1;
			const prefL = myPrefs.locations.toLowerCase().split(",").map((l: string) => l.trim());
			if (p.location && prefL.some((l: string) => p.location.toLowerCase().includes(l))) score += 1;
		}

		return total > 0 ? Math.round((score / total) * 100) : 0;
	};

	const interestMutation = useMutation({
		...orpc.interests.send.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.interests.list.queryKey({ input: { type: "sent" } }) });
			queryClient.invalidateQueries({ queryKey: orpc.wallet.get.queryKey({}) });
			playSound("ding");
			triggerConfetti();
			showFeedbackMsg(bidAmount > 0 ? `Interest sent with ${bidAmount} credits` : "Interest sent");
			setBidAmount(0);
			setShowBidSlider(false);
			setTimeout(goNext, 800);
		},
	});

	const shortlistMutation = useMutation({
		...orpc.shortlists.toggle.mutationOptions(),
		onSuccess: (data: any) => {
			queryClient.invalidateQueries({ queryKey: orpc.shortlists.list.queryKey({}) });
			playSound("pop");
			showFeedbackMsg(data.shortlisted ? "Shortlisted" : "Removed");
		},
	});

	const showFeedbackMsg = (msg: string) => {
		setActionFeedback(msg);
		setTimeout(() => setActionFeedback(null), 1200);
	};

	const triggerConfetti = () => {
		setShowConfetti(true);
		setTimeout(() => setShowConfetti(false), 2000);
	};

	const goNext = useCallback(() => {
		if (profiles.length > 0) setCurrentIndex((p) => (p + 1) % profiles.length);
	}, [profiles.length]);

	const goPrev = useCallback(() => {
		if (profiles.length > 0) setCurrentIndex((p) => (p - 1 + profiles.length) % profiles.length);
	}, [profiles.length]);

	const handlePass = () => {
		playSound("whoosh");
		showFeedbackMsg("Passed");
		goNext();
	};

	const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
		if (info.offset.x > 100) {
			// Swiped right → interest
			interestMutation.mutate({ toUserId: profiles[currentIndex]!.userId });
		} else if (info.offset.x < -100) {
			// Swiped left → pass
			handlePass();
		}
	};

	// Keyboard
	useEffect(() => {
		const h = (e: KeyboardEvent) => {
			if (e.key === "ArrowRight") goNext();
			if (e.key === "ArrowLeft") goPrev();
		};
		window.addEventListener("keydown", h);
		return () => window.removeEventListener("keydown", h);
	}, [goNext, goPrev]);

	if (isLoading) return <DiscoverSkeleton />;

	if (profiles.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ type: "spring", stiffness: 200, damping: 20 }}
					className="size-20 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center mb-6"
				>
					<HeartIcon className="size-9 text-primary" />
				</motion.div>
				<p className="font-display text-2xl font-bold">No profiles yet</p>
				<p className="text-muted-foreground mt-2 max-w-sm">Be one of the first to create a biodata and start discovering matches</p>
			</div>
		);
	}

	const p = profiles[currentIndex]!;
	const age = calcAge(p.dateOfBirth);
	const grad = avatarGradient(p.displayName);

	return (
		<div className="flex flex-col items-center relative" ref={constraintsRef}>
			{/* Ambient glow */}
			<div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 h-[300px] w-[300px] rounded-full bg-primary/3 blur-[120px]" />

			{/* Progress dots */}
			<div className="w-full max-w-lg mb-5 relative z-10">
				<div className="flex items-center justify-center gap-1.5 mb-3">
					{profiles.map((_, i) => (
						<button
							key={i}
							type="button"
							onClick={() => { setCurrentIndex(i); playSound("pop"); }}
							className={`h-1 rounded-full transition-all duration-300 ${
								i === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
							}`}
						/>
					))}
				</div>
				<div className="flex items-center justify-between">
					<p className="text-xs text-muted-foreground tracking-wide uppercase">
						<span className="font-display">Discover</span> · {currentIndex + 1}/{profiles.length}
					</p>
					<div className="flex items-center gap-1">
						<button onClick={() => { goPrev(); playSound("pop"); }} className="size-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors">
							<ChevronLeftIcon className="size-4 text-muted-foreground" />
						</button>
						<button onClick={() => { goNext(); playSound("pop"); }} className="size-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors">
							<ChevronRightIcon className="size-4 text-muted-foreground" />
						</button>
					</div>
				</div>
			</div>

			{/* Card */}
			<AnimatePresence mode="wait">
				<motion.div
					key={currentIndex}
					initial={{ opacity: 0, y: 20, scale: 0.97 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: -20, scale: 0.97 }}
					transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
					className="w-full max-w-lg relative z-10"
				>
					{/* Draggable wrapper */}
					<motion.div
						drag="x"
						dragConstraints={{ left: 0, right: 0 }}
						dragElastic={0.7}
						onDragEnd={handleDragEnd}
						style={{ x: dragX, rotate: dragRotate, opacity: dragOpacity }}
						className="cursor-grab active:cursor-grabbing"
					>
						<Card className="w-full overflow-hidden relative select-none">
							{/* Confetti */}
							<Confetti active={showConfetti} />

							{/* Swipe overlays */}
							<motion.div
								style={{ opacity: passOverlay }}
								className="absolute inset-0 z-30 flex items-center justify-center bg-rose-500/20 backdrop-blur-[2px] pointer-events-none rounded-lg"
							>
								<div className="size-20 rounded-full border-4 border-rose-500 flex items-center justify-center">
									<XIcon className="size-10 text-rose-500" />
								</div>
							</motion.div>
							<motion.div
								style={{ opacity: likeOverlay }}
								className="absolute inset-0 z-30 flex items-center justify-center bg-primary/20 backdrop-blur-[2px] pointer-events-none rounded-lg"
							>
								<div className="size-20 rounded-full border-4 border-primary flex items-center justify-center">
									<HeartIcon className="size-10 text-primary" />
								</div>
							</motion.div>

							{/* Feedback overlay */}
							<AnimatePresence>
								{actionFeedback && (
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
									>
										<motion.p
											initial={{ scale: 0.5, y: 10 }}
											animate={{ scale: 1, y: 0 }}
											transition={{ type: "spring", stiffness: 400, damping: 15 }}
											className="font-display text-2xl font-bold"
										>
											{actionFeedback}
										</motion.p>
									</motion.div>
								)}
							</AnimatePresence>

							{/* Gradient Banner */}
							<div className={`relative h-36 bg-gradient-to-br ${grad}`}>
								<div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
									<motion.div
										initial={{ scale: 0.8 }}
										animate={{ scale: 1 }}
										transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
										className="size-20 rounded-full bg-background border-4 border-background flex items-center justify-center shadow-lg overflow-hidden"
									>
										{p.profilePhoto ? (
											<img src={p.profilePhoto} alt={p.displayName} className="size-full object-cover" />
										) : (
											<span className="font-display text-3xl font-bold text-primary">{p.displayName.charAt(0)}</span>
										)}
									</motion.div>
								</div>
								{p.isVerified && (
									<Badge className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white text-xs border-0">Verified</Badge>
								)}
								{p.createdBy !== "self" && (
									<Badge className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white text-xs border-0">By {p.createdBy}</Badge>
								)}
								{/* Compatibility badge */}
								{myPrefs?.quizComplete && (() => {
									const compat = calcCompatibility(p);
									if (compat === 0) return null;
									return (
										<Badge className={`absolute bottom-3 right-3 text-xs border-0 backdrop-blur-sm ${
											compat >= 75 ? "bg-emerald-500/30 text-emerald-100" : compat >= 50 ? "bg-amber-500/30 text-amber-100" : "bg-white/20 text-white"
										}`}>
											{compat}% match
										</Badge>
									);
								})()}
							</div>

							{/* Name */}
							<CardContent className="pt-12 text-center">
								<motion.h2
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
									className="font-display text-2xl font-bold"
								>
									{p.displayName}
								</motion.h2>
								<motion.p
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.15 }}
									className="text-muted-foreground mt-1"
								>
									{age} years · {p.religion}{p.community ? ` · ${p.community}` : ""}
								</motion.p>

								<div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-sm text-muted-foreground">
									{p.location && <span className="flex items-center gap-1"><MapPinIcon className="size-3.5 text-primary/70" />{p.location}</span>}
									{p.height && <span className="flex items-center gap-1"><RulerIcon className="size-3.5 text-primary/70" />{p.height} cm</span>}
								</div>
							</CardContent>

							{/* About */}
							{p.aboutMe && (
								<CardContent className="pt-0">
									<motion.div
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.2 }}
										className="rounded-xl bg-accent/50 p-4"
									>
										<p className="text-sm italic text-foreground/80">"{p.aboutMe}"</p>
									</motion.div>
								</CardContent>
							)}

							{/* Looking for */}
							{p.lookingFor && (
								<CardContent className="pt-0">
									<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
										<p className="text-xs text-muted-foreground font-medium uppercase mb-1">Looking for</p>
										<p className="text-sm text-muted-foreground">{p.lookingFor}</p>
									</motion.div>
								</CardContent>
							)}

							{/* Details */}
							<CardContent className="pt-0">
								<motion.div
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.3 }}
									className="grid grid-cols-2 gap-4"
								>
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
								</motion.div>
							</CardContent>

							{/* Tags */}
							<CardContent className="pt-0">
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.35 }}
									className="flex flex-wrap gap-1.5"
								>
									{p.diet && <Badge className="bg-muted text-muted-foreground text-xs">{p.diet.replace(/_/g, " ")}</Badge>}
									{p.motherTongue && <Badge className="bg-muted text-muted-foreground text-xs">{p.motherTongue}</Badge>}
									{p.smoking !== "never" && <Badge className="bg-muted text-muted-foreground text-xs">Smokes: {p.smoking}</Badge>}
									{p.drinking !== "never" && <Badge className="bg-muted text-muted-foreground text-xs">Drinks: {p.drinking}</Badge>}
									{p.maritalStatus !== "never_married" && <Badge className="bg-amber-500/10 text-amber-500 text-xs">{p.maritalStatus.replace(/_/g, " ")}</Badge>}
								</motion.div>
							</CardContent>

							{/* Action Buttons */}
							<CardContent className="pt-2 pb-6">
								{/* Bid slider */}
								{showBidSlider && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: "auto" }}
										className="mb-4 rounded-xl bg-amber-500/5 border border-amber-500/20 p-4"
									>
										<div className="flex items-center justify-between mb-2">
											<span className="text-xs font-medium text-amber-500">Boost with credits</span>
											<span className="text-sm font-display font-bold text-amber-500">{bidAmount} credits</span>
										</div>
										<input
											type="range"
											min={0}
											max={Math.min(myWallet?.credits || 0, 50)}
											value={bidAmount}
											onChange={(e) => setBidAmount(Number.parseInt(e.target.value))}
											className="w-full accent-amber-500"
										/>
										<div className="flex justify-between text-[10px] text-muted-foreground mt-1">
											<span>Free</span>
											<span>Balance: {myWallet?.credits || 0}</span>
										</div>
									</motion.div>
								)}

								<div className="flex items-center justify-center gap-4">
									<motion.button
										type="button"
										onClick={() => { haptic(); handlePass(); }}
										whileTap={{ scale: 0.8 }}
										whileHover={{ scale: 1.08 }}
										transition={{ type: "spring", stiffness: 500, damping: 15 }}
										className="size-14 rounded-full border-2 border-muted-foreground/20 flex items-center justify-center hover:border-rose-500 hover:bg-rose-500/10"
									>
										<XIcon className="size-6 text-muted-foreground" />
									</motion.button>

									<motion.button
										type="button"
										onClick={() => { haptic(); shortlistMutation.mutate({ profileUserId: p.userId }); }}
										whileTap={{ scale: 0.8 }}
										whileHover={{ scale: 1.12 }}
										transition={{ type: "spring", stiffness: 500, damping: 15 }}
										className="size-12 rounded-full border-2 border-amber-500/30 flex items-center justify-center hover:border-amber-500 hover:bg-amber-500/10"
									>
										<BookmarkIcon className="size-5 text-amber-500" />
									</motion.button>

									<motion.button
										type="button"
										onClick={() => { haptic(); interestMutation.mutate({ toUserId: p.userId, bidAmount: bidAmount || undefined }); }}
										whileTap={{ scale: 0.75 }}
										whileHover={{ scale: 1.12 }}
										transition={{ type: "spring", stiffness: 350, damping: 10 }}
										className={`size-16 rounded-full flex items-center justify-center shadow-lg ${bidAmount > 0 ? "bg-amber-500 shadow-amber-500/25" : "bg-primary shadow-primary/25"}`}
									>
										<HeartIcon className="size-7 text-primary-foreground" />
									</motion.button>
								</div>

								<button
									type="button"
									onClick={() => setShowBidSlider(!showBidSlider)}
									className="w-full text-center text-[11px] text-amber-500/60 hover:text-amber-500 mt-3 transition-colors"
								>
									{showBidSlider ? "Hide bid" : "⚡ Boost with credits to stand out"}
								</button>
								<p className="text-center text-[10px] text-muted-foreground/40 mt-1">
									← → keys · swipe · tap ❤️
								</p>
							</CardContent>
						</Card>
					</motion.div>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
