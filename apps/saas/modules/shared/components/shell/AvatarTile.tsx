"use client";

import { useSession } from "@auth/hooks/use-session";
import { config } from "@config";
import { useOptionalHousehold } from "@household/components/HouseholdProvider";
import { useActiveOrganization } from "@organizations/hooks/use-active-organization";
import { authClient } from "@repo/auth/client";
import {
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui";
import { useRouter } from "@shared/hooks/router";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import Link from "next/link";

function initialsOf(name: string) {
	return name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => Array.from(part)[0] ?? "")
		.join("")
		.toUpperCase();
}

/**
 * The avatar tile (design.md §4.1): a 32px square with a 1px border and the user's initials in
 * Tiro, inside a 44px hit area. Never a circle and never a photo. It holds Settings, Household,
 * Credits, Close my search, the "Searching for" switcher and Appearance.
 */
export function AvatarTile() {
	const t = useTranslations("shell.avatar");
	const { user } = useSession();
	const householdContext = useOptionalHousehold();
	const { setActiveOrganization } = useActiveOrganization();
	const router = useRouter();
	const { theme, setTheme } = useTheme();

	const { data: households = [] } = useQuery({
		...orpc.households.listMine.queryOptions(),
		staleTime: 5 * 60_000,
	});

	if (!user) {
		return null;
	}

	const slug = householdContext?.slug ?? households[0]?.slug ?? null;
	const abilities = householdContext?.abilities;

	const signOut = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					window.location.href = new URL(
						config.redirectAfterLogout,
						window.location.origin,
					).toString();
				},
			},
		});
	};

	const switchTo = async (nextSlug: string) => {
		if (nextSlug === slug) {
			return;
		}
		await setActiveOrganization(nextSlug);
		router.push(`/${nextSlug}`);
	};

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label={t("open", { name: user.name ?? "" })}
					className="group size-11 -mr-1.5 inline-flex shrink-0 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-ring"
				>
					<span
						aria-hidden="true"
						className="size-8 inline-flex items-center justify-center border border-foreground/70 bg-card font-display text-ui text-foreground transition-colors group-hover:border-foreground group-data-[state=open]:border-foreground"
					>
						{initialsOf(user.name ?? user.email) || "·"}
					</span>
				</button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" sideOffset={6} className="w-72">
				<div className="px-3 pt-2 pb-2">
					<p className="truncate font-display text-letter">{user.name}</p>
					<p className="truncate text-meta text-muted-foreground">{user.email}</p>
				</div>

				{households.length > 1 && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuLabel>{t("searchingFor")}</DropdownMenuLabel>
						<DropdownMenuRadioGroup
							value={slug ?? undefined}
							onValueChange={(value) => void switchTo(value)}
						>
							{households.map((household) => (
								<DropdownMenuRadioItem key={household.slug} value={household.slug}>
									{household.candidateName}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</>
				)}

				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href="/settings/general">{t("settings")}</Link>
				</DropdownMenuItem>
				{slug && (
					<DropdownMenuItem asChild>
						<Link href={`/${slug}/settings/members`}>{t("household")}</Link>
					</DropdownMenuItem>
				)}
				{slug && (abilities?.canBill ?? true) && (
					<DropdownMenuItem asChild>
						<Link href={`/${slug}/settings/billing`}>{t("credits")}</Link>
					</DropdownMenuItem>
				)}
				{slug && abilities?.isCandidate && (
					<DropdownMenuItem asChild>
						<Link href={`/${slug}/close`}>{t("closeSearch")}</Link>
					</DropdownMenuItem>
				)}
				<DropdownMenuItem asChild>
					<Link href="/new-organization">{t("startForSomeoneElse")}</Link>
				</DropdownMenuItem>
				{user.role === "admin" && (
					<DropdownMenuItem asChild>
						<Link href="/admin/users">{t("admin")}</Link>
					</DropdownMenuItem>
				)}

				<DropdownMenuSeparator />
				<DropdownMenuLabel>{t("appearance")}</DropdownMenuLabel>
				<DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
					<DropdownMenuRadioItem value="light">{t("paper")}</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="dark">{t("lamp")}</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="system">{t("followPhone")}</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>

				<DropdownMenuSeparator />
				<DropdownMenuItem
					onSelect={() => void signOut()}
					className={cn("text-muted-foreground")}
				>
					{t("signOut")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
