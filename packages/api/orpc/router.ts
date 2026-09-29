import type { RouterClient } from "@orpc/server";

import { adminRouter } from "../modules/admin/router";
import { aiRouter } from "../modules/ai/router";
import { familyLinksRouter } from "../modules/family-links/router";
import { folioRouter } from "../modules/folio/router";
import { householdsRouter } from "../modules/households/router";
import { interestsRouter } from "../modules/interests/router";
import { marginRouter } from "../modules/margin/router";
import { matchesRouter } from "../modules/matches/router";
import { messagesRouter } from "../modules/messages/router";
import { notificationsRouter } from "../modules/notifications/router";
import { organizationsRouter } from "../modules/organizations/router";
import { paymentsRouter } from "../modules/payments/router";
import { preferencesRouter } from "../modules/preferences/router";
import { profilesRouter } from "../modules/profiles/router";
import { reportsRouter } from "../modules/reports/router";
import { shortlistsRouter } from "../modules/shortlists/router";
import { usersRouter } from "../modules/users/router";
import { walletRouter } from "../modules/wallet/router";
import { publicProcedure } from "./procedures";

export const router = publicProcedure.router({
	admin: adminRouter,
	organizations: organizationsRouter,
	users: usersRouter,
	payments: paymentsRouter,
	ai: aiRouter,
	notifications: notificationsRouter,
	households: householdsRouter,
	profiles: profilesRouter,
	preferences: preferencesRouter,
	folio: folioRouter,
	shortlists: shortlistsRouter,
	interests: interestsRouter,
	matches: matchesRouter,
	messages: messagesRouter,
	familyLinks: familyLinksRouter,
	margin: marginRouter,
	reports: reportsRouter,
	wallet: walletRouter,
});

export type ApiRouterClient = RouterClient<typeof router>;
