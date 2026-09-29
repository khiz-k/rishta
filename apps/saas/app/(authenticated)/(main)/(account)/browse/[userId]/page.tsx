import { redirectToHousehold } from "@household/lib/server";
import { getPageByUserId } from "@repo/database";
import { redirect } from "next/navigation";

/** Legacy /browse/[userId] resolves to the page's own address, /b/[handle]. */
export default async function LegacyBrowseRedirect({
	params,
}: {
	params: Promise<{ userId: string }>;
}) {
	const { userId } = await params;
	const page = await getPageByUserId(userId);
	if (page) {
		redirect(`/b/${page.handle}`);
	}
	return redirectToHousehold();
}
