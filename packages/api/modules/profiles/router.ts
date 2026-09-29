import { blockUserProcedure } from "./procedures/block-user";
import { getMyPage } from "./procedures/get-my-page";
import { getPage } from "./procedures/get-page";
import { listReaders } from "./procedures/list-readers";
import { patchPage } from "./procedures/patch-page";
import { pausePage, resumePage } from "./procedures/pause-page";
import { addPhoto } from "./procedures/photos/add-photo";
import { createPhotoUploadUrl } from "./procedures/photos/create-upload-url";
import { removePhoto } from "./procedures/photos/remove-photo";
import { updatePhoto } from "./procedures/photos/update-photo";
import { publishPage } from "./procedures/publish-page";
import { setFieldVisibility } from "./procedures/set-visibility";
import { trackRead } from "./procedures/track-read";
import { upsertPage } from "./procedures/upsert-page";

/**
 * The biodata page. `browse`, `get`, `trackView` and `viewers` were replaced by `folio.today`,
 * `getPage`, `trackRead` and `readers` (spec.md §8, privacy leaks closed).
 */
export const profilesRouter = {
	me: getMyPage,
	upsert: upsertPage,
	patch: patchPage,
	setVisibility: setFieldVisibility,
	publish: publishPage,
	pause: pausePage,
	resume: resumePage,
	getPage,
	trackRead,
	readers: listReaders,
	block: blockUserProcedure,
	photos: {
		createUploadUrl: createPhotoUploadUrl,
		add: addPhoto,
		update: updatePhoto,
		remove: removePhoto,
	},
};
