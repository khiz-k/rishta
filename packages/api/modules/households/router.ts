import { claimPage } from "./procedures/claim-page";
import { closePreview } from "./procedures/close-preview";
import { closeSearch } from "./procedures/close-search";
import { createHousehold } from "./procedures/create-household";
import { declineClaim } from "./procedures/decline-claim";
import { deleteHousehold } from "./procedures/delete-household";
import { getClaim } from "./procedures/get-claim";
import { getHousehold } from "./procedures/get-household";
import { inviteCandidate } from "./procedures/invite-candidate";
import { listMyHouseholds } from "./procedures/list-my-households";
import { setClosingStory } from "./procedures/set-closing-story";
import { setMemberLabel } from "./procedures/set-member-label";
import { updateHouseholdSettings } from "./procedures/update-settings";

export const householdsRouter = {
	create: createHousehold,
	get: getHousehold,
	listMine: listMyHouseholds,
	updateSettings: updateHouseholdSettings,
	setMemberLabel,
	inviteCandidate,
	getClaim,
	claim: claimPage,
	declineClaim,
	closePreview,
	closeSearch,
	setClosingStory,
	delete: deleteHousehold,
};
