import { redirectToHousehold } from "@household/lib/server";

/** Legacy route (design.md §3.4): now part of the household's pages. */
export default async function LegacyRedirect() {
	return redirectToHousehold("/biodata/readers");
}
