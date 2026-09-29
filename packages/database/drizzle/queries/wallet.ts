import { and, desc, eq, gte, sql } from "drizzle-orm";

import { db, type DbExecutor } from "../client";
import { WELCOME_CREDITS, type LedgerReason } from "../domain";
import { creditLedger, wallet } from "../schema/postgres";

/** Returns the household wallet, creating it with the welcome credits (and ledger row) if missing. */
export async function ensureHouseholdWallet(
	organizationId: string,
	options: { userId?: string | null; executor?: DbExecutor } = {},
) {
	const executor = options.executor ?? db;
	const existing = await executor.query.wallet.findFirst({
		where: eq(wallet.organizationId, organizationId),
	});

	if (existing) {
		return existing;
	}

	const [created] = await executor
		.insert(wallet)
		.values({
			organizationId,
			userId: options.userId ?? null,
			credits: WELCOME_CREDITS,
		})
		.onConflictDoNothing({ target: wallet.organizationId })
		.returning();

	if (!created) {
		// Created concurrently by another request.
		const concurrent = await executor.query.wallet.findFirst({
			where: eq(wallet.organizationId, organizationId),
		});
		if (!concurrent) {
			throw new Error("Wallet could not be created");
		}
		return concurrent;
	}

	await executor.insert(creditLedger).values({
		walletId: created.id,
		organizationId,
		delta: WELCOME_CREDITS,
		reason: "welcome",
		createdByUserId: options.userId ?? null,
	});

	return created;
}

export async function getWalletLedger(organizationId: string, limit = 20) {
	return db.query.creditLedger.findMany({
		where: eq(creditLedger.organizationId, organizationId),
		orderBy: [desc(creditLedger.createdAt)],
		limit,
	});
}

/**
 * Spends credits inside the caller's transaction. Returns the new balance, or null when the
 * wallet does not hold enough credits (nothing is written in that case).
 */
export async function spendHouseholdCredits(
	executor: DbExecutor,
	params: {
		organizationId: string;
		entries: Array<{
			reason: Extract<LedgerReason, "extra_note" | "priority_note">;
			delta: number;
		}>;
		interestId?: string | null;
		userId: string;
	},
) {
	const total = params.entries.reduce((sum, entry) => sum + entry.delta, 0);
	if (total <= 0) {
		return null;
	}

	const [updated] = await executor
		.update(wallet)
		.set({
			credits: sql`${wallet.credits} - ${total}`,
			totalSpent: sql`${wallet.totalSpent} + ${total}`,
		})
		.where(and(eq(wallet.organizationId, params.organizationId), gte(wallet.credits, total)))
		.returning();

	if (!updated) {
		return null;
	}

	await executor.insert(creditLedger).values(
		params.entries.map((entry) => ({
			walletId: updated.id,
			organizationId: params.organizationId,
			delta: -entry.delta,
			reason: entry.reason,
			interestId: params.interestId ?? null,
			createdByUserId: params.userId,
		})),
	);

	return updated.credits;
}

/**
 * Grants credits for a completed one-time purchase. Idempotent: the unique `purchaseId` on the
 * ledger means a webhook retry never grants twice. Returns false when already granted.
 */
export async function grantPurchasedCredits(params: {
	organizationId: string;
	purchaseId: string;
	credits: number;
	userId?: string | null;
}) {
	return db.transaction(async (tx) => {
		const walletRow = await ensureHouseholdWallet(params.organizationId, {
			userId: params.userId,
			executor: tx,
		});

		const [ledgerRow] = await tx
			.insert(creditLedger)
			.values({
				walletId: walletRow.id,
				organizationId: params.organizationId,
				delta: params.credits,
				reason: "purchase",
				purchaseId: params.purchaseId,
				createdByUserId: params.userId ?? null,
			})
			.onConflictDoNothing({ target: creditLedger.purchaseId })
			.returning();

		if (!ledgerRow) {
			return false;
		}

		await tx
			.update(wallet)
			.set({ credits: sql`${wallet.credits} + ${params.credits}` })
			.where(eq(wallet.id, walletRow.id));

		return true;
	});
}

/**
 * Grants Premium's monthly credits once per calendar month (UTC). Called lazily when the wallet
 * is read, so no cron is needed. Returns true when a grant was written.
 */
export async function applyMonthlyCreditGrant(params: {
	organizationId: string;
	credits: number;
	now?: Date;
}) {
	if (params.credits <= 0) {
		return false;
	}

	const now = params.now ?? new Date();
	const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

	return db.transaction(async (tx) => {
		const walletRow = await ensureHouseholdWallet(params.organizationId, { executor: tx });

		// Serialise concurrent grants for this wallet.
		await tx.execute(
			sql`SELECT id FROM ${wallet} WHERE ${wallet.id} = ${walletRow.id} FOR UPDATE`,
		);

		const existing = await tx.query.creditLedger.findFirst({
			where: and(
				eq(creditLedger.walletId, walletRow.id),
				eq(creditLedger.reason, "monthly_grant"),
				gte(creditLedger.createdAt, monthStart),
			),
		});

		if (existing) {
			return false;
		}

		await tx.insert(creditLedger).values({
			walletId: walletRow.id,
			organizationId: params.organizationId,
			delta: params.credits,
			reason: "monthly_grant",
		});
		await tx
			.update(wallet)
			.set({ credits: sql`${wallet.credits} + ${params.credits}` })
			.where(eq(wallet.id, walletRow.id));

		return true;
	});
}
