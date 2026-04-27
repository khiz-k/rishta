import { getProfileStats } from "./procedures/get-profile-stats";
import { listInterests } from "./procedures/list-interests";
import { listMatches } from "./procedures/list-matches";
import { respondInterest } from "./procedures/respond-interest";
import { sendInterest } from "./procedures/send-interest";

export const interestsRouter = {
	send: sendInterest,
	respond: respondInterest,
	list: listInterests,
	profileStats: getProfileStats,
	matches: listMatches,
};
