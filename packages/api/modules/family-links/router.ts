import { createFamilyLink } from "./procedures/create-link";
import { listFamilyLinksProcedure } from "./procedures/list-links";
import { openFamilyLink } from "./procedures/open-link";
import { reactFamilyLink } from "./procedures/react-link";
import { reportFamilyLink } from "./procedures/report-link";
import { revokeFamilyLink } from "./procedures/revoke-link";

export const familyLinksRouter = {
	create: createFamilyLink,
	list: listFamilyLinksProcedure,
	revoke: revokeFamilyLink,
	open: openFamilyLink,
	react: reactFamilyLink,
	report: reportFamilyLink,
};
