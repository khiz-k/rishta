import type { SQL } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Quality rule S4: the template's `updatePurchase` ran an UPDATE with no WHERE clause, so one
 * payment webhook overwrote every purchase row. These tests build the real drizzle statements
 * and run them against an in-memory `purchase` table that behaves like Postgres: a statement
 * without a WHERE touches every row. They fail if a purchase helper loses its filter.
 */
type Row = Record<string, unknown>;

const { rows, statements } = vi.hoisted(() => ({
	rows: new Map<string, Row>(),
	statements: [] as { sql: string; params: unknown[] }[],
}));

interface BuiltStatement {
	where(condition: SQL | undefined): BuiltStatement;
	returning(fields?: Record<string, unknown>): BuiltStatement;
	toSQL(): { sql: string; params: unknown[] };
}

vi.mock("../client", async () => {
	const { drizzle } = await import("drizzle-orm/node-postgres");
	const { eq } = await import("drizzle-orm");
	const { PgDialect } = await import("drizzle-orm/pg-core");
	const schema = await import("../schema");
	const builder = drizzle.mock({ schema });
	const dialect = new PgDialect();

	/** The rows a WHERE selects. Only `"purchase"."<column>" = $n` is understood. */
	function targets(sql: string, params: unknown[]): Row[] {
		const where = /\swhere\s(.+?)(?:\sreturning\s.*)?$/.exec(sql)?.[1];
		if (!where) {
			return [...rows.values()];
		}
		const filter = /^"purchase"\."(\w+)" = \$(\d+)$/.exec(where);
		if (!filter?.[1] || !filter[2]) {
			throw new Error(`The in-memory purchase table cannot run WHERE ${where}`);
		}
		const [, column, index] = filter;
		const value = params[Number(index) - 1];
		return [...rows.values()].filter((row) => row[column] === value);
	}

	/** Records the statement drizzle built and runs it when awaited, like the pg driver. */
	function statement(built: BuiltStatement, run: (touched: Row[]) => Row[]) {
		const chain = {
			where(condition: SQL | undefined) {
				built = built.where(condition);
				return chain;
			},
			returning(fields?: Record<string, unknown>) {
				built = built.returning(fields);
				return chain;
			},
			then(resolve: (value: Row[]) => void, reject: (error: unknown) => void) {
				try {
					const query = built.toSQL();
					statements.push(query);
					resolve(run(targets(query.sql, query.params)));
				} catch (error) {
					reject(error);
				}
			},
		};
		return chain;
	}

	const db = {
		update: (table: typeof schema.purchase) => ({
			set: (patch: Row) =>
				statement(
					builder.update(table).set(patch) as unknown as BuiltStatement,
					(touched) =>
						touched.map((row) => {
							for (const [key, value] of Object.entries(patch)) {
								if (value !== undefined) {
									row[key] = value;
								}
							}
							return { id: row.id };
						}),
				),
		}),
		delete: (table: typeof schema.purchase) =>
			statement(builder.delete(table) as unknown as BuiltStatement, (touched) => {
				for (const row of touched) {
					rows.delete(String(row.id));
				}
				return [];
			}),
		query: {
			purchase: {
				findFirst: async ({
					where,
				}: {
					where: (table: typeof schema.purchase, operators: { eq: typeof eq }) => SQL;
				}) => {
					const query = dialect.sqlToQuery(where(schema.purchase, { eq }));
					const [row] = targets(` where ${query.sql}`, query.params);
					return row ? { ...row } : undefined;
				},
			},
		},
	};

	return { db };
});

import { deletePurchaseBySubscriptionId, updatePurchase } from "./purchases";

function seed(id: string, overrides: Row) {
	rows.set(id, {
		id,
		organizationId: null,
		userId: null,
		type: "SUBSCRIPTION",
		customerId: `cus_${id}`,
		subscriptionId: `sub_${id}`,
		priceId: "price_premium_month",
		status: "active",
		createdAt: new Date("2026-09-01T12:00:00Z"),
		updatedAt: null,
		...overrides,
	});
}

beforeEach(() => {
	rows.clear();
	statements.length = 0;
	seed("purchase-priya", { organizationId: "org-priya" });
	seed("purchase-arjun", { organizationId: "org-arjun" });
});

describe("updatePurchase", () => {
	it("updates only the purchase it is given, filtered by its id", async () => {
		const updated = await updatePurchase({ id: "purchase-priya", status: "canceled" });

		const [update] = statements;
		expect(update?.sql).toMatch(/^update "purchase" set .+ where "purchase"\."id" = \$\d+/);
		expect(update?.params).toContain("purchase-priya");
		expect(updated).toMatchObject({ id: "purchase-priya", status: "canceled" });
		expect(rows.get("purchase-priya")?.status).toBe("canceled");
		expect(rows.get("purchase-arjun")?.status).toBe("active");
	});

	it("changes nothing and returns nothing for an unknown id", async () => {
		await expect(updatePurchase({ id: "purchase-404", status: "canceled" })).resolves.toBe(
			undefined,
		);

		expect([...rows.values()].map((row) => row.status)).toEqual(["active", "active"]);
	});
});

describe("deletePurchaseBySubscriptionId", () => {
	it("deletes only the purchase for that subscription", async () => {
		await deletePurchaseBySubscriptionId("sub_purchase-arjun");

		expect(statements[0]?.sql).toMatch(
			/^delete from "purchase" where "purchase"\."subscriptionId" = \$1$/,
		);
		expect([...rows.keys()]).toEqual(["purchase-priya"]);
	});
});
