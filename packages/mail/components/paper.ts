/**
 * The Paper palette for email (tooling/tailwind/theme.css, design.md §7). Email clients cannot
 * read CSS variables, so the values are written out here and nowhere else in the mail package.
 */
export const paper = {
	desk: "#f5efe3",
	page: "#fffbf3",
	ink: "#1f1b16",
	muted: "#5e554a",
	border: "#cdbfa6",
	input: "#8a7b63",
	seal: "#933113",
	rim: "#c98a17",
	sealed: "#efe6d6",
	onSeal: "#ffffff",
} as const;

/** Tiro and Anek when the reader has them; dependable serif and sans stacks when they don't. */
export const fonts = {
	display: '"Tiro Devanagari Hindi", Georgia, "Times New Roman", serif',
	sans: '"Anek Latin", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
} as const;
