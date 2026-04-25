"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { type PropsWithChildren, useEffect } from "react";

export default function AccountLayout({ children }: PropsWithChildren) {
	const pathname = usePathname();
	const router = useRouter();

	const { data: prefs, isLoading: prefsLoading } = useQuery(
		orpc.preferences.get.queryOptions({}),
	);

	const { data: profile, isLoading: profileLoading } = useQuery(
		orpc.profiles.me.queryOptions({}),
	);

	const isLoading = prefsLoading || profileLoading;

	// Allowed pages before completing setup
	const isSetupPage = pathname === "/quiz" || pathname === "/profile/edit" || pathname.startsWith("/settings");

	useEffect(() => {
		if (isLoading || isSetupPage) return;

		// Step 1: Must complete quiz first
		if (!prefs?.quizComplete) {
			router.replace("/quiz");
			return;
		}

		// Step 2: Must create profile
		if (!profile) {
			router.replace("/profile/edit");
			return;
		}
	}, [isLoading, isSetupPage, prefs, profile, router]);

	return <>{children}</>;
}
