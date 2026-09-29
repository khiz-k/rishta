import { getFormatter, getMessages, getTranslations } from "next-intl/server";

import { getLetterPrices } from "../lib/prices";
import { LetterParagraph, LetterSection } from "./LetterSection";

/**
 * Pricing as the letter's last paragraph (design.md §15.9), then the same three offers as a
 * plain ruled ledger for anyone who wants to scan. No cards, no "most popular" ribbon, no
 * invented statistics.
 */
export async function PricingLedger() {
	const t = await getTranslations("home.pricing");
	const tp = await getTranslations("pricing.products");
	const format = await getFormatter();
	const products = (await getMessages()).pricing.products;
	const prices = getLetterPrices();

	const money = (amount: number, currency = prices.currency) =>
		format.number(amount, { style: "currency", currency, maximumFractionDigits: 0 });

	const monthly = money(prices.monthly);
	const yearly = money(prices.yearly);
	const credits = money(prices.credits, prices.creditsCurrency);

	const rows = [
		{
			key: "free",
			name: tp("free.title"),
			price: [money(0)],
			note: undefined,
			features: Object.values(products.free.features),
		},
		{
			key: "premium",
			name: tp("premium.title"),
			price: [t("premiumMonthly", { monthly }), t("premiumYearly", { yearly })],
			note: prices.trialDays > 0 ? t("trial", { days: prices.trialDays }) : undefined,
			features: Object.values(products.premium.features),
		},
		{
			key: "credits",
			name: tp("credits.title"),
			price: [t("creditsPrice", { amount: credits })],
			note: undefined,
			features: Object.values(products.credits.features),
		},
	];

	return (
		<LetterSection id="pricing" heading={t("heading")}>
			<LetterParagraph>
				{t("paragraph", { monthly, yearly, credits, trialDays: prices.trialDays })}
			</LetterParagraph>

			<div className="pt-2">
				<h3 className="sr-only">{t("ledgerLabel")}</h3>
				<dl className="border-t border-foreground">
					{rows.map((row) => (
						<div
							key={row.key}
							className="py-4 gap-x-6 gap-y-1 sm:grid-cols-[10rem_1fr] grid grid-cols-1 border-b border-border"
						>
							<dt>
								<span className="block font-display text-section text-foreground">
									{row.name}
								</span>
								{row.price.map((line) => (
									<span
										key={line}
										className="block text-meta text-foreground tabular"
									>
										{line}
									</span>
								))}
								{row.note && (
									<span className="block text-meta text-muted-foreground">
										{row.note}
									</span>
								)}
							</dt>
							<dd>
								<ul className="space-y-0.5 text-body text-foreground">
									{row.features.map((feature) => (
										<li key={feature}>{feature}</li>
									))}
								</ul>
							</dd>
						</div>
					))}
				</dl>
				<p className="mt-4 text-meta text-muted-foreground">{t("never")}</p>
			</div>
		</LetterSection>
	);
}
