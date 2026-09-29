import { AI_TIMEOUT_MS, generateText, isAiConfigured, Output, textModel } from "@repo/ai";
import { logger } from "@repo/logs";
import type { z } from "zod";

/**
 * Runs one structured generation with a 12-second timeout. Returns null when AI is not
 * configured or anything fails, so every caller falls back instead of throwing at the user.
 */
export async function runStructured<T>(params: {
	name: string;
	schema: z.ZodType<T>;
	system: string;
	prompt: string;
}): Promise<T | null> {
	if (!isAiConfigured()) {
		return null;
	}

	try {
		const result = await generateText({
			model: textModel,
			system: params.system,
			prompt: params.prompt,
			output: Output.object({ schema: params.schema, name: params.name }),
			timeout: AI_TIMEOUT_MS,
			maxRetries: 1,
		});
		const parsed = params.schema.safeParse(result.output);
		return parsed.success ? parsed.data : null;
	} catch (error) {
		logger.warn(`AI ${params.name} fell back`, { error: String(error) });
		return null;
	}
}
