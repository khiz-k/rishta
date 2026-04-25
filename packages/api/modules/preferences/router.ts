import { getPreferences } from "./procedures/get-preferences";
import { upsertPreferences } from "./procedures/upsert-preferences";

export const preferencesRouter = {
	get: getPreferences,
	upsert: upsertPreferences,
};
