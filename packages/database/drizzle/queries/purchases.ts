import { eq } from "drizzle-orm";
import type { z } from "zod";

import { db } from "../client";
import { purchase } from "../schema/postgres";
import type { PurchaseInsertSchema, PurchaseUpdateSchema } from "../zod";

export async function getPurchasesByOrganizationId(organizationId: string) {
	return db.query.purchase.findMany({
		where: (purchase, { eq }) => eq(purchase.organizationId, organizationId),
	});
}

export async function getPurchasesByUserId(userId: string) {
	return db.query.purchase.findMany({
		where: (purchase, { eq }) => eq(purchase.userId, userId),
	});
}

export async function getPurchaseById(id: string) {
	return db.query.purchase.findFirst({
		where: (purchase, { eq }) => eq(purchase.id, id),
	});
}

export async function getPurchaseBySubscriptionId(subscriptionId: string) {
	return db.query.purchase.findFirst({
		where: (purchase, { eq }) => eq(purchase.subscriptionId, subscriptionId),
	});
}

export async function createPurchase(insertedPurchase: z.infer<typeof PurchaseInsertSchema>) {
	const [{ id }] = await db
		.insert(purchase)
		.values(insertedPurchase)
		.returning({ id: purchase.id });

	return getPurchaseById(id);
}

export async function updatePurchase(updatedPurchase: z.infer<typeof PurchaseUpdateSchema>) {
	const { id, ...patch } = updatedPurchase;
	const [updated] = await db
		.update(purchase)
		.set(patch)
		.where(eq(purchase.id, id))
		.returning({ id: purchase.id });

	return updated ? getPurchaseById(updated.id) : undefined;
}

export async function deletePurchaseBySubscriptionId(subscriptionId: string) {
	await db.delete(purchase).where(eq(purchase.subscriptionId, subscriptionId));
}
