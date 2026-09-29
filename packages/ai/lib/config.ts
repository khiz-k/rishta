/** The model name behind `textModel`, recorded alongside cached AI output. */
export const TEXT_MODEL_ID = "gpt-4o-mini";

/** Every AI call gives up after this long and falls back (spec.md §9). */
export const AI_TIMEOUT_MS = 12_000;

/**
 * Whether a model API key is configured for the OpenAI provider used by `textModel`.
 * Server-side only: never import this into a client bundle.
 */
export function isAiConfigured(): boolean {
	const key = process.env.OPENAI_API_KEY;
	return typeof key === "string" && key.trim().length > 0;
}
