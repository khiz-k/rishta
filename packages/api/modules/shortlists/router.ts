import { listShortlists } from "./procedures/list-shortlists";
import { toggleShortlist } from "./procedures/toggle-shortlist";

export const shortlistsRouter = {
	list: listShortlists,
	toggle: toggleShortlist,
};
