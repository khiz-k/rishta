import { getKept } from "./procedures/get-kept";
import { getToday } from "./procedures/get-today";
import { markFolioPage } from "./procedures/mark-page";

export const folioRouter = {
	today: getToday,
	mark: markFolioPage,
	kept: getKept,
};
