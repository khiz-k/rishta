/**
 * The one place that decides whether a key press belongs to the control that has focus rather
 * than to a global, grid or list shortcut (quality rule A1).
 *
 * A shortcut must do nothing, and must not call `preventDefault`, while focus is on:
 * - a text field (input, textarea, select, contenteditable, textbox roles), where letters type;
 * - a native or ARIA control (button, a[href], switch, tab, option, menu item, slider, …), where
 *   Enter and Space activate and letters may drive typeahead;
 * - anything inside a composite widget that owns its arrow and letter keys (a menu, listbox,
 *   radio group, tab list, grid or tree), or inside a Radix popper.
 *
 * It is written against a minimal element shape so it runs without a DOM (unit tests) and
 * accepts whatever `KeyboardEvent.target` is (the window and the document are never controls).
 */
export interface ElementLike {
	tagName: string;
	getAttribute(name: string): string | null;
	hasAttribute(name: string): boolean;
	isContentEditable?: boolean;
	parentElement: ElementLike | null;
}

/** Tags that are always interactive when they can take focus. */
const INTERACTIVE_TAGS = new Set(["BUTTON", "INPUT", "TEXTAREA", "SELECT", "SUMMARY"]);

/** Single-control ARIA roles: Enter, Space and letters belong to them. */
const INTERACTIVE_ROLES = new Set([
	"button",
	"link",
	"menuitem",
	"menuitemcheckbox",
	"menuitemradio",
	"option",
	"switch",
	"tab",
	"slider",
	"spinbutton",
	"checkbox",
	"radio",
	"combobox",
	"textbox",
	"searchbox",
	"treeitem",
	"gridcell",
]);

/** Composite widgets that own their arrow and letter keys (typeahead, roving focus). */
const KEY_OWNING_ROLES = new Set([
	"menu",
	"menubar",
	"listbox",
	"radiogroup",
	"tablist",
	"grid",
	"treegrid",
	"tree",
]);

function isElementLike(value: unknown): value is ElementLike {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as ElementLike).tagName === "string" &&
		typeof (value as ElementLike).getAttribute === "function" &&
		typeof (value as ElementLike).hasAttribute === "function"
	);
}

function isEditable(element: ElementLike) {
	if (element.isContentEditable) {
		return true;
	}
	const editable = element.getAttribute("contenteditable");
	return editable !== null && editable.toLowerCase() !== "false";
}

/** The element itself is a control or text field (not its ancestors). */
function isInteractiveElement(element: ElementLike) {
	const tag = element.tagName.toUpperCase();
	if (INTERACTIVE_TAGS.has(tag)) {
		return true;
	}
	if (tag === "A" && element.hasAttribute("href")) {
		return true;
	}
	if (isEditable(element)) {
		return true;
	}
	const role = element.getAttribute("role")?.trim().toLowerCase();
	return role ? INTERACTIVE_ROLES.has(role) || KEY_OWNING_ROLES.has(role) : false;
}

export interface InteractiveTargetOptions {
	/**
	 * Items of the list or grid that owns the shortcut (its own rows). Focus on one of them is
	 * the shortcut's home, not a foreign control: ↑ / ↓ on a letter row moves to the next row.
	 */
	ownItem?: (element: ElementLike) => boolean;
}

/**
 * True when a key press on `target` belongs to the focused control, so a shortcut must ignore
 * it. Walks up from the target, because focus can sit on an element inside a control or inside
 * a composite widget (a menu's content, a Radix popper).
 */
export function isInteractiveTarget(
	target: EventTarget | ElementLike | null | undefined,
	options: InteractiveTargetOptions = {},
): boolean {
	if (!isElementLike(target)) {
		return false;
	}
	if (options.ownItem?.(target)) {
		return false;
	}
	let element: ElementLike | null = target;
	while (element) {
		if (isInteractiveElement(element)) {
			return true;
		}
		if (element.hasAttribute("data-radix-popper-content-wrapper")) {
			return true;
		}
		element = element.parentElement;
	}
	return false;
}
