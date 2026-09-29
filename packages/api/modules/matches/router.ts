import { closeIntroduction } from "./procedures/close-introduction";
import { getIntroduction } from "./procedures/get-introduction";
import { listIntroductions } from "./procedures/list-introductions";
import { markSealsSeen } from "./procedures/mark-seals-seen";
import { proposeCall } from "./procedures/propose-call";
import { setAvailability } from "./procedures/set-availability";
import { shareContact } from "./procedures/share-contact";

export const matchesRouter = {
	list: listIntroductions,
	get: getIntroduction,
	markSealsSeen,
	setAvailability,
	proposeCall,
	shareContact,
	close: closeIntroduction,
};
