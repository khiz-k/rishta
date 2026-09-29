import { ensureHouseholdWallet, getWalletLedger, LEDGER_REASONS } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { requireHousehold } from "../../households/lib/context";
import { applyMonthlyGrantIfDue, getEntitlements } from "../../households/lib/entitlements";

export const getWallet = protectedProcedure
	.route({
		method: "GET",
		path: "/wallet",
		tags: ["Wallet"],
		summary: "The household's credits and ledger",
		description:
			"New households start with 10 credits. Premium adds 2 each month, granted when the wallet is read.",
	})
	.input(z.object({ organizationId: z.string() }))
	.output(
		z.object({
			credits: z.number().int(),
			plan: z.enum(["free", "premium"]),
			ledger: z.array(
				z.object({
					id: z.string(),
					delta: z.number().int(),
					reason: z.enum(LEDGER_REASONS),
					createdAt: z.string(),
				}),
			),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		await requireHousehold(input.organizationId, user.id, ["owner", "admin"]);
		const entitlements = await getEntitlements(input.organizationId);
		await ensureHouseholdWallet(input.organizationId, { userId: user.id });
		await applyMonthlyGrantIfDue(input.organizationId, entitlements);

		const [walletRow, ledger] = await Promise.all([
			ensureHouseholdWallet(input.organizationId),
			getWalletLedger(input.organizationId, 20),
		]);

		return {
			credits: walletRow.credits,
			plan: entitlements.plan,
			ledger: ledger.map((row) => ({
				id: row.id,
				delta: row.delta,
				reason: row.reason,
				createdAt: row.createdAt.toISOString(),
			})),
		};
	});
