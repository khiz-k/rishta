import { addMarginNote } from "./procedures/add-note";
import { listMarginNotes } from "./procedures/list-notes";
import { removeMarginNote } from "./procedures/remove-note";

export const marginRouter = {
	list: listMarginNotes,
	add: addMarginNote,
	remove: removeMarginNote,
};
