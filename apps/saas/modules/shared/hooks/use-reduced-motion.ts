"use client";

import { useMediaQuery } from "./use-media-query";

/** prefers-reduced-motion: the right-hand column of design.md §10. */
export function useReducedMotion() {
	return useMediaQuery("(prefers-reduced-motion: reduce)");
}
