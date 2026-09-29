"use client";

import { useSession } from "@auth/hooks/use-session";
import { sealInitials } from "@repo/ui";
import type { Household } from "@shared/lib/api-types";
import { firstNameOf } from "@shared/lib/format";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { createContext, type PropsWithChildren, useContext, useMemo } from "react";

/**
 * The household the signed-in person is reading for, and what their role lets them do
 * (spec.md §13). Only the candidate seals, answers and closes; guardians keep and pencil;
 * family pencils. Every screen asks this, never the raw role.
 */
export interface HouseholdAbilities {
	/** The candidate (the household owner whose page it is). */
	isCandidate: boolean;
	/** Seal a note, say yes, decline, withdraw, close (candidate on an active page). */
	canSeal: boolean;
	canAnswer: boolean;
	/** Keep a page ("Keep for Priya"): candidate or guardian. */
	canKeep: boolean;
	/** Pass a page: candidate only. */
	canPass: boolean;
	/** Pencil notes: anyone in the household. */
	canPencil: boolean;
	/** Create or revoke family links: candidate or guardian. */
	canShare: boolean;
	/** Household settings, roles and removals: the owner. */
	canManage: boolean;
	/** Billing and credits: candidate or guardian. */
	canBill: boolean;
	/** Read letters (the candidate only; family sees stage lines at most). */
	canReadLetters: boolean;
}

export interface HouseholdContextValue {
	household: Household;
	slug: string;
	organizationId: string;
	candidateFirstName: string;
	/** The candidate's two-letter monogram ("PS" for Priya Sharma): only the candidate seals. */
	candidateInitials: string;
	userFirstName: string;
	abilities: HouseholdAbilities;
	keyboardShortcuts: boolean;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function abilitiesFor(household: Household): HouseholdAbilities {
	const isCandidate = household.isCandidate && household.role === "owner";
	const pageActive = household.page?.status === "active";
	const guardianOrOwner = household.role === "owner" || household.role === "admin";
	return {
		isCandidate,
		canSeal: isCandidate && pageActive,
		canAnswer: isCandidate,
		canKeep: guardianOrOwner && Boolean(household.candidate.userId),
		canPass: isCandidate,
		canPencil: true,
		canShare: guardianOrOwner,
		canManage: household.role === "owner",
		canBill: guardianOrOwner,
		canReadLetters: isCandidate,
	};
}

export function HouseholdProvider({
	household: initialHousehold,
	children,
}: PropsWithChildren<{ household: Household }>) {
	const { user } = useSession();
	const { data } = useQuery({
		...orpc.households.get.queryOptions({
			input: { organizationSlug: initialHousehold.slug },
		}),
		initialData: initialHousehold,
		staleTime: 30_000,
	});
	const household = data ?? initialHousehold;

	const value = useMemo<HouseholdContextValue>(
		() => ({
			household,
			slug: household.slug,
			organizationId: household.id,
			candidateFirstName: household.candidate.firstName,
			candidateInitials: sealInitials(household.candidate.displayName),
			userFirstName: firstNameOf(user?.name ?? household.candidate.firstName),
			abilities: abilitiesFor(household),
			keyboardShortcuts: household.settings.keyboardShortcuts,
		}),
		[household, user?.name],
	);

	return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold() {
	const context = useContext(HouseholdContext);
	if (!context) {
		throw new Error("useHousehold must be used inside a HouseholdProvider");
	}
	return context;
}

export function useOptionalHousehold() {
	return useContext(HouseholdContext);
}
