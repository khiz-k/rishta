import type { SafetyCategory, SafetyFlag } from "@repo/database";

import { findContactDetails } from "../../interests/lib/note-rules";

/**
 * Deterministic safety rules (spec.md §9d), run before any AI. A match creates a flag shown to
 * the recipient only; nothing is hidden and the sender is not told.
 */
const RULES: Array<{ category: SafetyCategory; pattern: RegExp; reason: string }> = [
	{
		category: "money",
		pattern:
			/\b(?:wire (?:me|transfer)|western union|moneygram|gift ?cards?|bitcoin|crypto|usdt|send (?:me )?(?:money|funds|cash)|small loan|a loan|lend me|bank details|bank account|paypal|zelle|venmo|cash ?app)\b/i,
		reason: "asks about money",
	},
	{
		category: "off_platform",
		pattern:
			/\b(?:whats\s?app|telegram|signal app|on signal|wechat|viber|kik|snap(?:chat)?|instagram|text me|call me|my number|your number)\b/i,
		reason: "asks to move off Rishta before you've spoken",
	},
	{
		category: "visa",
		pattern:
			/\b(?:green card|sponsor(?:ship)?|visa|my papers|immigration|citizenship for me)\b/i,
		reason: "mentions visas or papers",
	},
	{
		category: "harassment",
		pattern:
			/\b(?:sexy|nudes?|send (?:me )?(?:pics|pictures|photos) of you|bitch|slut|whore|shut up|you owe me|or else)\b/i,
		reason: "uses language that may not be respectful",
	},
];

export function runSafetyRules(text: string): SafetyFlag | null {
	const matched = RULES.filter((rule) => rule.pattern.test(text));
	const categories = matched.map((rule) => rule.category);

	// Contact details inside a message are an off-platform signal too.
	if (!categories.includes("off_platform") && findContactDetails(text)) {
		categories.push("off_platform");
		matched.push({
			category: "off_platform",
			pattern: /./,
			reason: "shares contact details before you've both agreed",
		});
	}

	const [first] = matched;
	if (!first) {
		return null;
	}

	return {
		category: first.category,
		categories,
		reason: matched.map((rule) => rule.reason).join("; "),
		source: "rules",
	};
}
