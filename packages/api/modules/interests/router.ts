import { listMatchesAlias } from "../matches/procedures/list-introductions";
import { countLetters } from "./procedures/count-letters";
import { getLetter } from "./procedures/get-letter";
import { listLetters } from "./procedures/list-letters";
import { respondLetter } from "./procedures/respond-letter";
import { sendLetter } from "./procedures/send-letter";
import { withdrawLetter } from "./procedures/withdraw-letter";

/**
 * Letters. `profileStats` (a privacy leak and bid mechanics) is removed; `matches` is an alias
 * of `matches.list` during the migration.
 */
export const interestsRouter = {
	send: sendLetter,
	withdraw: withdrawLetter,
	respond: respondLetter,
	list: listLetters,
	get: getLetter,
	counts: countLetters,
	matches: listMatchesAlias,
};
