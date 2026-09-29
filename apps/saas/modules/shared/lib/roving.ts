import type { KeyboardEvent } from "react";

const GROUPS = '[role="radiogroup"], [role="listbox"]';
const ITEMS = '[role="radio"], [role="option"]';

function itemsOf(group: HTMLElement) {
	return Array.from(group.querySelectorAll<HTMLElement>(ITEMS)).filter(
		(item) =>
			item.closest(GROUPS) === group &&
			!item.hasAttribute("disabled") &&
			item.getAttribute("aria-disabled") !== "true",
	);
}

/**
 * Arrow keys for a custom radio group or listbox built from buttons (WAI-ARIA APG):
 * - ↓ and → go to the next item, ↑ and ← to the previous (mirrored right to left), wrapping;
 *   Home and End go to the ends.
 * - Tab leaves the group, because only one item is tabbable (see `rovingTabIndex`).
 * - In a radio group the move also chooses: the radio is clicked, or `onMove` runs instead when
 *   a click does more than choose (closing a sheet, for instance).
 * - In a listbox only focus moves, and Enter or Space chooses, so an arrow never decides.
 *
 * Only use a radio group where choosing changes local or form state. Where a tap saves at once
 * (a family reaction, who sees a photo), use a group of `aria-pressed` buttons instead.
 */
export function onRovingKeyDown(
	event: KeyboardEvent<HTMLElement>,
	onMove?: (item: HTMLElement) => void,
) {
	const group = event.currentTarget;
	const items = itemsOf(group);
	if (items.length === 0) {
		return;
	}
	const rtl = getComputedStyle(group).direction === "rtl";
	const index = items.findIndex((item) => item === document.activeElement);
	const forward = index < 0 ? 0 : index + 1;
	const back = index < 0 ? items.length - 1 : index - 1;

	let target: number;
	switch (event.key) {
		case "ArrowDown":
			target = forward;
			break;
		case "ArrowUp":
			target = back;
			break;
		case "ArrowRight":
			target = rtl ? back : forward;
			break;
		case "ArrowLeft":
			target = rtl ? forward : back;
			break;
		case "Home":
			target = 0;
			break;
		case "End":
			target = items.length - 1;
			break;
		default:
			return;
	}

	event.preventDefault();
	const item = items[(target + items.length) % items.length];
	if (!item) {
		return;
	}
	item.focus();
	if (group.getAttribute("role") === "radiogroup") {
		if (onMove) {
			onMove(item);
		} else {
			item.click();
		}
	}
}

/** Only the chosen item (or the first, while nothing is chosen) sits in the Tab order. */
export function rovingTabIndex(selected: boolean, index: number, anySelected: boolean) {
	return selected || (!anySelected && index === 0) ? 0 : -1;
}
