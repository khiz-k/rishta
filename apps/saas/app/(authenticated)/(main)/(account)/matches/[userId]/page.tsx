import { getSession } from "@auth/lib/server";
import { redirectToHousehold } from "@household/lib/server";
import { getLettersBetweenUsers } from "@repo/database";
import { redirect } from "next/navigation";

/** Legacy /matches/[userId] (the old chat) resolves the letter between the pair. */
export default async function LegacyChatRedirect({
	params,
}: {
	params: Promise<{ userId: string }>;
}) {
	const [{ userId }, session] = await Promise.all([params, getSession()]);
	if (session) {
		const letters = await getLettersBetweenUsers(session.user.id, userId);
		const letter = letters.find((row) => row.status === "accepted") ?? letters[0];
		if (letter) {
			redirect(`/letters/${letter.id}`);
		}
	}
	return redirectToHousehold("/letters");
}
