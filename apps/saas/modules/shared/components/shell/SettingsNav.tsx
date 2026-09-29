"use client";

import { cn } from "@repo/ui";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The thin text sub-nav under the masthead on settings pages (design.md §4.1): your account and,
 * when you have one, your household. Square underlines, no tabs, no icons.
 */
export function SettingsNav({ slug, isAdmin }: { slug: string | null; isAdmin?: boolean }) {
	const t = useTranslations("settingsNav");
	const pathname = usePathname() ?? "";

	const groups: Array<{ label: string; items: Array<{ href: string; label: string }> }> = [
		{
			label: t("account"),
			items: [
				{ href: "/settings/general", label: t("general") },
				{ href: "/settings/security", label: t("security") },
				{ href: "/settings/notifications", label: t("notifications") },
			],
		},
	];
	if (slug) {
		groups.push({
			label: t("household"),
			items: [
				{ href: `/${slug}/settings/general`, label: t("householdSettings") },
				{ href: `/${slug}/settings/members`, label: t("members") },
				{ href: `/${slug}/settings/billing`, label: t("billing") },
			],
		});
	}
	if (isAdmin) {
		groups.push({
			label: t("moderation"),
			items: [
				{ href: "/admin/reports", label: t("reports") },
				{ href: "/admin/users", label: t("users") },
				{ href: "/admin/organizations", label: t("households") },
			],
		});
	}

	return (
		<nav
			aria-label={t("label")}
			data-print-hide
			className="no-scrollbar overflow-x-auto border-b border-border bg-background"
		>
			<div className="px-4 md:px-6 lg:px-10 gap-8 mx-auto flex max-w-[1440px]">
				{groups.map((group) => (
					<div key={group.label} className="gap-5 flex shrink-0 items-stretch">
						<span className="py-3 self-center label-caps text-muted-foreground">
							{group.label}
						</span>
						{group.items.map((item) => {
							const active =
								pathname === item.href || pathname.startsWith(`${item.href}/`);
							return (
								<Link
									key={item.href}
									href={item.href}
									aria-current={active ? "page" : undefined}
									className={cn(
										// Inset: the nav scrolls sideways, so an outside ring would be clipped.
										"min-h-11 -mb-px flex items-center border-b-2 text-ui whitespace-nowrap focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
										active
											? "border-foreground text-foreground"
											: "border-transparent text-muted-foreground hover:text-foreground",
									)}
								>
									{item.label}
								</Link>
							);
						})}
					</div>
				))}
			</div>
		</nav>
	);
}

/** A settings page body: a paper column with a Tiro title, no PageHeader stack. */
export function SettingsPage({
	title,
	lead,
	children,
}: {
	title: string;
	lead?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="px-4 md:px-6 pt-6 md:pt-10 max-w-3xl mx-auto">
			<h1 className="font-display text-title">{title}</h1>
			{lead && <p className="mt-2 text-body text-muted-foreground">{lead}</p>}
			<div className="mt-8 gap-6 flex flex-col">{children}</div>
		</div>
	);
}

/** One settings block on paper: a Tiro heading, a line of explanation, then its controls. */
export function SettingsBlock({
	title,
	description,
	children,
	tone = "plain",
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
	tone?: "plain" | "danger";
}) {
	return (
		<section className="border border-border bg-card">
			<div className="px-5 md:px-6 pt-5 pb-5">
				<h2
					className={cn(
						"font-display text-section",
						tone === "danger" && "text-destructive",
					)}
				>
					{title}
				</h2>
				{description && (
					<p className="mt-1 text-meta text-muted-foreground">{description}</p>
				)}
				<div className="mt-4">{children}</div>
			</div>
		</section>
	);
}
