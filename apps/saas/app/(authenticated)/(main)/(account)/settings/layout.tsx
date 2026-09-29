import { getSession } from "@auth/lib/server";
import { getActiveHouseholdSlug } from "@household/lib/server";
import { SettingsNav } from "@shared/components/shell/SettingsNav";
import type { PropsWithChildren } from "react";

export default async function AccountSettingsLayout({ children }: PropsWithChildren) {
	const [slug, session] = await Promise.all([getActiveHouseholdSlug(), getSession()]);
	return (
		<>
			<SettingsNav slug={slug} isAdmin={session?.user.role === "admin"} />
			{children}
		</>
	);
}
