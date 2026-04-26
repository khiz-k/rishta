"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { PageHeader } from "@shared/components/PageHeader";
import {
	CheckIcon,
	CrownIcon,
	EyeIcon,
	HeartIcon,
	MessageCircleIcon,
	RocketIcon,
	SparklesIcon,
	ZapIcon,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

const FREE_FEATURES = [
	{ icon: HeartIcon, label: "3 interests per day" },
	{ icon: SparklesIcon, label: "Basic compatibility %" },
	{ icon: MessageCircleIcon, label: "Chat with matches" },
];

const PREMIUM_FEATURES = [
	{ icon: HeartIcon, label: "Unlimited interests", highlight: true },
	{ icon: EyeIcon, label: "See who viewed your profile", highlight: true },
	{ icon: RocketIcon, label: "Profile Boost — top of discover queue", highlight: true },
	{ icon: SparklesIcon, label: "Advanced compatibility breakdown" },
	{ icon: MessageCircleIcon, label: "Message before matching" },
	{ icon: CrownIcon, label: "'Serious' badge on your profile" },
	{ icon: ZapIcon, label: "Priority in search results" },
];

export default function PremiumPage() {
	return (
		<div className="space-y-8 max-w-2xl mx-auto">
			<PageHeader title="Vow Premium" subtitle="For those who are serious about finding their person" />

			<div className="grid gap-6 md:grid-cols-2">
				{/* Free Tier */}
				<Card className="relative">
					<CardHeader>
						<CardTitle className="font-display text-lg">Free</CardTitle>
						<p className="text-3xl font-display font-bold">$0<span className="text-sm font-normal text-muted-foreground">/month</span></p>
					</CardHeader>
					<CardContent className="space-y-3">
						{FREE_FEATURES.map((f) => (
							<div key={f.label} className="flex items-center gap-2 text-sm text-muted-foreground">
								<CheckIcon className="size-4 text-primary shrink-0" />
								{f.label}
							</div>
						))}
					</CardContent>
				</Card>

				{/* Premium Tier */}
				<motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
					<Card className="relative border-primary/50 shadow-lg shadow-primary/10">
						<div className="absolute -top-3 left-1/2 -translate-x-1/2">
							<Badge className="bg-primary text-primary-foreground px-3 py-1">Most Popular</Badge>
						</div>
						<CardHeader>
							<CardTitle className="font-display text-lg flex items-center gap-2">
								<CrownIcon className="size-5 text-amber-500" /> Premium
							</CardTitle>
							<p className="text-3xl font-display font-bold">$29<span className="text-sm font-normal text-muted-foreground">/month</span></p>
						</CardHeader>
						<CardContent className="space-y-3">
							{PREMIUM_FEATURES.map((f) => (
								<div key={f.label} className={`flex items-center gap-2 text-sm ${f.highlight ? "text-foreground font-medium" : "text-muted-foreground"}`}>
									<CheckIcon className="size-4 text-primary shrink-0" />
									{f.label}
								</div>
							))}
							<Button className="w-full mt-4" size="lg" disabled>
								<CrownIcon className="size-4 mr-2" /> Coming Soon
							</Button>
							<p className="text-xs text-center text-muted-foreground">Payments launching soon. Early users get first month free.</p>
						</CardContent>
					</Card>
				</motion.div>
			</div>

			{/* Profile Boost */}
			<Card className="relative overflow-hidden">
				<div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
				<CardContent className="pt-6">
					<div className="flex items-start gap-4">
						<div className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
							<RocketIcon className="size-6 text-amber-500" />
						</div>
						<div className="flex-1">
							<h3 className="font-display font-bold text-lg">Profile Boost</h3>
							<p className="text-sm text-muted-foreground mt-1">
								Jump to the top of everyone's discover queue for 24 hours. 
								Get 5x more views and interests.
							</p>
							<div className="flex items-center gap-3 mt-3">
								<Button variant="outline" size="sm" disabled>
									<ZapIcon className="size-3.5 mr-1.5" /> Boost for $5 — Coming Soon
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Stats teaser */}
			<Card>
				<CardContent className="pt-6">
					<h3 className="font-display font-semibold mb-4">Why go Premium?</h3>
					<div className="grid grid-cols-3 gap-4 text-center">
						<div>
							<p className="font-display text-2xl font-bold text-primary">5x</p>
							<p className="text-xs text-muted-foreground">more profile views</p>
						</div>
						<div>
							<p className="font-display text-2xl font-bold text-primary">3x</p>
							<p className="text-xs text-muted-foreground">more matches</p>
						</div>
						<div>
							<p className="font-display text-2xl font-bold text-primary">∞</p>
							<p className="text-xs text-muted-foreground">daily interests</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
