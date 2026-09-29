import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The type scale from tooling/tailwind/theme.css (`--text-*`). tailwind-merge only knows t-shirt
 * sizes, so without this list it reads `text-ui` or `text-button` as a text *colour*. It would then
 * drop a button's `text-primary-foreground` when a caller passes `text-ui`, or drop the
 * button's own `text-button` size.
 */
const TYPE_SCALE = [
	"label",
	"ref",
	"meta",
	"ui",
	"button",
	"body",
	"letter",
	"section",
	"wordmark",
	"title-sm",
	"name-sm",
	"title",
	"family-name",
	"family-value",
	"family-button",
];

const twMerge = extendTailwindMerge({
	extend: {
		theme: {
			text: TYPE_SCALE,
		},
	},
});

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
