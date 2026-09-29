/**
 * A deterministic denylist applied to AI drafts (spec.md §9a): sentences about complexion are
 * removed and reported back, so the page never carries them.
 */
const COMPLEXION_TERMS = [
	"fair",
	"fair-skinned",
	"fair skinned",
	"fairer",
	"wheatish",
	"wheat-ish",
	"dusky",
	"gora",
	"gori",
	"light-skinned",
	"light skinned",
	"dark-skinned",
	"dark skinned",
	"milky",
	"whitish",
	"complexion",
	"skin tone",
	"sanwla",
	"saanwla",
	"saanwli",
	"gehuan",
];

/** Words that only look like a complexion term: "fair-minded" describes character, not skin. */
const NOT_COMPLEXION: Partial<Record<string, string>> = {
	fair: "(?![-\\s]?minded)",
};

const TERM_PATTERN = new RegExp(
	`\\b(?:${COMPLEXION_TERMS.map(
		(term) => term.replace(/[-\s]/g, "[-\\s]?") + (NOT_COMPLEXION[term] ?? ""),
	).join("|")})\\b`,
	"i",
);

export function stripComplexionSentences(text: string) {
	const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
	const omitted: string[] = [];
	const kept: string[] = [];

	for (const sentence of sentences) {
		const found = sentence.match(TERM_PATTERN);
		if (found) {
			omitted.push(found[0].toLowerCase());
		} else {
			kept.push(sentence);
		}
	}

	return { text: kept.join("").trim(), omitted };
}
