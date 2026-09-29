import { redirectToHousehold } from "@household/lib/server";

/** "/" is the active household's Folio. */
export default async function RootRedirect() {
	return redirectToHousehold();
}
