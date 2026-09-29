"use client";

import { usePurchases } from "@payments/hooks/purchases";
import { Button, cn } from "@repo/ui";
import { SettingsBlock } from "@shared/components/shell/SettingsNav";
import { formatShortDate } from "@shared/lib/format";
import { orpc } from "@shared/lib/orpc-query-utils";
import { onRovingKeyDown, rovingTabIndex } from "@shared/lib/roving";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { CustomerPortalButton } from "../../settings/components/CustomerPortalButton";
import { useHousehold } from "./HouseholdProvider";

/**
 * Credits & plan (design.md §5.13): the plan in words, credits and their ledger, a $5 pack, and
 * Premium in two plain columns. No invented statistics and no "Most popular" ribbon.
 */
export function CreditsAndPlan() {
	const t = useTranslations("credits");
	const tPricing = useTranslations("pricing.products");
	const locale = useLocale();
	const { organizationId, slug, household, abilities, candidateFirstName } = useHousehold();
	const [interval, setBillingInterval] = useState<"month" | "year">("month");
	const [checkoutError, setCheckoutError] = useState(false);
	const wallet = useQuery({
		...orpc.wallet.get.queryOptions({ input: { organizationId } }),
		enabled: abilities.canBill,
	});
	const { activePlan } = usePurchases(organizationId);
	const checkout = useMutation(orpc.payments.createCheckoutLink.mutationOptions());

	if (!abilities.canBill) {
		return (
			<p className="text-body text-muted-foreground">
				{t("familyNote", { name: candidateFirstName })}
			</p>
		);
	}

	const premium = household.plan === "premium";
	const purchaseId = activePlan && "purchaseId" in activePlan ? activePlan.purchaseId : undefined;

	const go = async (planId: "credits" | "premium") => {
		setCheckoutError(false);
		try {
			const { checkoutLink } = await checkout.mutateAsync({
				planId,
				type: planId === "credits" ? "one-time" : "subscription",
				interval: planId === "premium" ? interval : undefined,
				organizationId,
				redirectUrl: `${window.location.origin}/checkout-return?organizationId=${organizationId}&next=/${slug}/settings/billing`,
			});
			window.location.href = checkoutLink;
		} catch {
			setCheckoutError(true);
		}
	};

	const ledgerReason = (reason: string) => {
		const path = `ledger.${reason}` as Parameters<typeof t>[0];
		return t.has(path) ? t(path) : reason;
	};

	return (
		<div className="gap-6 flex flex-col">
			<SettingsBlock title={t("plan.title")}>
				<p className="font-display text-letter">
					{premium ? t("plan.premium") : t("plan.free")}
				</p>
				{purchaseId && (
					<div className="mt-4">
						<CustomerPortalButton purchaseId={purchaseId} />
						<p className="mt-2 text-meta text-muted-foreground">
							{t("plan.portalNote")}
						</p>
					</div>
				)}
			</SettingsBlock>

			<SettingsBlock title={t("wallet.title")} description={t("wallet.description")}>
				{wallet.isPending ? (
					<div className="h-8 w-24 animate-paper-appear bg-muted" aria-hidden="true" />
				) : wallet.data ? (
					<>
						<p className="font-display text-title-sm tabular">
							{t("wallet.count", { count: wallet.data.credits })}
						</p>
						<div className="mt-4 gap-3 flex flex-wrap items-center">
							<Button
								variant="secondary"
								loading={
									checkout.isPending && checkout.variables?.planId === "credits"
								}
								onClick={() => void go("credits")}
							>
								{t("wallet.buy")}
							</Button>
						</div>
						{wallet.data.ledger.length > 0 && (
							<ul className="mt-5 border-t border-border">
								{wallet.data.ledger.map((row) => (
									<li
										key={row.id}
										className="py-2 gap-3 flex justify-between border-b border-border text-body tabular"
									>
										<span>
											<span className="text-muted-foreground">
												{formatShortDate(row.createdAt, locale)} ·{" "}
											</span>
											{ledgerReason(row.reason)}
										</span>
										<span
											className={
												row.delta < 0 ? "text-foreground" : "text-success"
											}
										>
											{row.delta > 0
												? `+${row.delta}`
												: `−${Math.abs(row.delta)}`}
										</span>
									</li>
								))}
							</ul>
						)}
					</>
				) : (
					<p className="text-body text-muted-foreground">{t("wallet.error")}</p>
				)}
			</SettingsBlock>

			<SettingsBlock title={t("compare.title")}>
				<div className="gap-6 md:grid-cols-2 grid">
					{(["free", "premium"] as const).map((plan) => (
						<div
							key={plan}
							className={cn(
								"p-4 border",
								plan === household.plan ? "border-foreground" : "border-border",
							)}
						>
							<p className="font-display text-section">{tPricing(`${plan}.title`)}</p>
							<p className="mt-1 text-meta text-muted-foreground">
								{tPricing(`${plan}.description`)}
							</p>
							<ul className="mt-3 gap-1.5 flex flex-col">
								{(plan === "free"
									? (["folio", "notes", "family", "links", "safety"] as const)
									: (["folio", "notes", "credits", "family", "links"] as const)
								).map((feature) => (
									<li
										key={feature}
										className="gap-2 grid grid-cols-[1rem_1fr] text-body"
									>
										<span aria-hidden="true">·</span>
										{plan === "free"
											? tPricing(
													`free.features.${feature as "folio" | "notes" | "family" | "links" | "safety"}`,
												)
											: tPricing(
													`premium.features.${feature as "folio" | "notes" | "credits" | "family" | "links"}`,
												)}
									</li>
								))}
							</ul>
							{plan === "free" ? (
								<p className="mt-4 text-meta text-muted-foreground">
									{t("compare.freePrice")}
								</p>
							) : (
								<>
									<p className="mt-4 text-body tabular">
										{interval === "month"
											? t("compare.monthly")
											: t("compare.yearly")}
									</p>
									{!premium && (
										<div className="mt-3 gap-3 flex flex-wrap items-center">
											<div
												role="radiogroup"
												aria-label={t("compare.interval")}
												onKeyDown={(event) => onRovingKeyDown(event)}
												className="inline-grid grid-cols-2 border border-foreground"
											>
												{(["month", "year"] as const).map(
													(value, index) => (
														<button
															key={value}
															type="button"
															role="radio"
															aria-checked={interval === value}
															tabIndex={rovingTabIndex(
																interval === value,
																index,
																true,
															)}
															onClick={() =>
																setBillingInterval(value)
															}
															className={cn(
																"min-h-11 px-3 border-foreground label-caps first:border-r",
																interval === value
																	? "bg-secondary text-secondary-foreground"
																	: "hover:bg-accent",
															)}
														>
															{t(`compare.${value}`)}
														</button>
													),
												)}
											</div>
											<Button
												variant="primary"
												loading={
													checkout.isPending &&
													checkout.variables?.planId === "premium"
												}
												onClick={() => void go("premium")}
											>
												{t("compare.start")}
											</Button>
										</div>
									)}
									<p className="mt-2 text-meta text-muted-foreground">
										{t("compare.trial")}
									</p>
								</>
							)}
						</div>
					))}
				</div>
				{checkoutError && (
					<p role="alert" className="mt-4 text-body text-destructive">
						{t("checkoutFailed")}
					</p>
				)}
				<p className="mt-4 text-meta text-muted-foreground">{t("compare.whatCreditsDo")}</p>
			</SettingsBlock>
		</div>
	);
}
