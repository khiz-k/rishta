import type { SafetyFlag } from "@repo/database";
import { z } from "zod";

import { SAFETY_SCREEN_SYSTEM_PROMPT } from "./prompts";
import { runStructured } from "./run";
import { runSafetyRules } from "./safety-rules";

const SafetyScreenSchema = z.object({
	flag: z.boolean(),
	category: z.enum(["money", "off_platform", "visa", "harassment", "none"]),
	reason: z.string().max(140),
});

/** AI screening runs on notes and on the first 10 messages of an introduction only. */
export const AI_SCREENED_MESSAGES = 10;

/**
 * Rules first, AI second (only if configured and no rule matched). Never blocks; the result is
 * stored for the recipient's view.
 */
export async function screenText(
	text: string,
	options: { kind: "note" | "message"; messageIndex?: number },
): Promise<SafetyFlag | null> {
	const byRules = runSafetyRules(text);
	if (byRules) {
		return byRules;
	}

	if (options.kind === "message" && (options.messageIndex ?? 0) >= AI_SCREENED_MESSAGES) {
		return null;
	}

	const screened = await runStructured({
		name: "safety_screen",
		schema: SafetyScreenSchema,
		system: SAFETY_SCREEN_SYSTEM_PROMPT,
		prompt: text,
	});

	if (!screened || !screened.flag || screened.category === "none") {
		return null;
	}

	return {
		category: screened.category,
		categories: [screened.category],
		reason: screened.reason,
		source: "ai",
	};
}
