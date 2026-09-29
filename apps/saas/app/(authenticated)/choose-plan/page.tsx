import { redirectToHousehold } from "@household/lib/server";

export const dynamic = "force-dynamic";

/**
 * The template's plan picker is gone. A household chooses Premium in Credits & plan (design.md
 * §5.13: the plan in words and two plain columns, no cards, no "recommended" ribbon), so this
 * old entry point goes straight there. Nothing requires a plan to use Rishta
 * (`requireActiveSubscription` is off), so nobody is sent here any more.
 */
export default async function ChoosePlanPage() {
	return redirectToHousehold("/settings/billing");
}
