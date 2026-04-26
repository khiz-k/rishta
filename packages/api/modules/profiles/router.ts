import { blockUserProcedure } from "./procedures/block-user";
import { browseProfiles } from "./procedures/browse-profiles";
import { getMyProfile } from "./procedures/get-my-profile";
import { getProfile } from "./procedures/get-profile";
import { trackView } from "./procedures/track-view";
import { upsertProfile } from "./procedures/upsert-profile";
import { whoViewedMe } from "./procedures/who-viewed-me";

export const profilesRouter = {
	me: getMyProfile,
	upsert: upsertProfile,
	browse: browseProfiles,
	get: getProfile,
	trackView: trackView,
	viewers: whoViewedMe,
	block: blockUserProcedure,
};
