import { redirectToHousehold } from "@household/lib/server";

/** Billing is per household: account billing goes to the active household's Credits & plan. */
export default async function AccountBillingRedirect() {
	return redirectToHousehold("/settings/billing");
}
