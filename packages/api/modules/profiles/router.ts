import { browseProfiles } from "./procedures/browse-profiles";
import { getMyProfile } from "./procedures/get-my-profile";
import { getProfile } from "./procedures/get-profile";
import { upsertProfile } from "./procedures/upsert-profile";

export const profilesRouter = {
	me: getMyProfile,
	upsert: upsertProfile,
	browse: browseProfiles,
	get: getProfile,
};
