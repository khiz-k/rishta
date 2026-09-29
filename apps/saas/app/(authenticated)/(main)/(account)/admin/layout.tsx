import { getSession } from "@auth/lib/server";
import { getActiveHouseholdSlug } from "@household/lib/server";
import { SettingsNav } from "@shared/components/shell/SettingsNav";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

/** Moderation (platform admins only): reports first, then users and households. */
export default async function AdminLayout({ children }: PropsWithChildren) {
	const t = await getTranslations("admin");
	const [session, slug] = await Promise.all([getSession(), getActiveHouseholdSlug()]);

	if (!session) {
		redirect("/login");
	}

	if (session.user?.role !== "admin") {
		redirect("/");
	}

	return (
		<>
			<SettingsNav slug={slug} isAdmin />
			<div className="px-4 md:px-6 lg:px-10 pt-6 md:pt-10 mx-auto max-w-[1200px]">
				<h1 className="font-display text-title">{t("title")}</h1>
				<p className="mt-2 text-body text-muted-foreground">{t("description")}</p>
				<div className="mt-8">{children}</div>
			</div>
		</>
	);
}
