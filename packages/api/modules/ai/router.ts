import { draftBiodata } from "./procedures/draft-biodata";
import { getAiStatus } from "./procedures/get-status";
import { suggestFirstLine } from "./procedures/suggest-first-line";

/**
 * AI assists: visible drafts only, never decisions. Translation and safety screening are
 * internal (lib/translate.ts, lib/safety.ts). The template chatbot (`stream`) is removed.
 */
export const aiRouter = {
	status: getAiStatus,
	draftBiodata,
	suggestFirstLine,
};
