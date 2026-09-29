import { getSession } from "@auth/lib/server";
import { SettingsNav } from "@shared/components/shell/SettingsNav";
import type { PropsWithChildren } from "react";

/** Household settings share the account's thin sub-nav under the masthead. */
export default async function HouseholdSettingsLayout({
	children,
	params,
}: PropsWithChildren<{ params: Promise<{ organizationSlug: string }> }>) {
	const [{ organizationSlug }, session] = await Promise.all([params, getSession()]);
	return (
		<>
			<SettingsNav slug={organizationSlug} isAdmin={session?.user.role === "admin"} />
			{children}
		</>
	);
}
