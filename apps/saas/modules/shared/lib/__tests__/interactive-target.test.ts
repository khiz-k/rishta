import { describe, expect, it } from "vitest";

import { type ElementLike, isInteractiveTarget } from "../interactive-target";

/** A minimal element for the node test environment: a tag, attributes and a parent. */
function el(
	tagName: string,
	attributes: Record<string, string> = {},
	parent: ElementLike | null = null,
	isContentEditable = false,
): ElementLike {
	return {
		tagName: tagName.toUpperCase(),
		getAttribute: (name) => (name in attributes ? (attributes[name] ?? null) : null),
		hasAttribute: (name) => name in attributes,
		isContentEditable,
		parentElement: parent,
	};
}

describe("isInteractiveTarget", () => {
	it("leaves shortcuts to the page when nothing interactive has focus", () => {
		const body = el("body");
		const article = el("article", {}, el("section", { "aria-roledescription": "page stack" }));

		expect(isInteractiveTarget(body)).toBe(false);
		expect(isInteractiveTarget(article)).toBe(false);
		expect(isInteractiveTarget(el("h2", { tabindex: "-1" }, article))).toBe(false);
		expect(isInteractiveTarget(null)).toBe(false);
		expect(isInteractiveTarget(undefined)).toBe(false);
	});

	it("ignores targets that are not elements (the window, the document)", () => {
		expect(isInteractiveTarget({} as EventTarget)).toBe(false);
		expect(isInteractiveTarget({ nodeType: 9 } as unknown as EventTarget)).toBe(false);
	});

	it("claims every text field", () => {
		for (const tag of ["input", "textarea", "select"]) {
			expect(isInteractiveTarget(el(tag))).toBe(true);
		}
		expect(isInteractiveTarget(el("div", { contenteditable: "" }))).toBe(true);
		expect(isInteractiveTarget(el("div", { contenteditable: "plaintext-only" }))).toBe(true);
		expect(isInteractiveTarget(el("p", {}, null, true))).toBe(true);
		expect(isInteractiveTarget(el("div", { role: "textbox" }))).toBe(true);
	});

	it("does not treat contenteditable=false as a text field", () => {
		expect(isInteractiveTarget(el("div", { contenteditable: "false" }))).toBe(false);
	});

	it("claims buttons and links with an href, not bare anchors", () => {
		expect(isInteractiveTarget(el("button"))).toBe(true);
		expect(isInteractiveTarget(el("summary"))).toBe(true);
		expect(isInteractiveTarget(el("a", { href: "/priya-k3m/letters" }))).toBe(true);
		expect(isInteractiveTarget(el("a", { id: "top" }))).toBe(false);
	});

	it("claims every interactive ARIA role the rule lists", () => {
		for (const role of [
			"button",
			"menuitem",
			"menuitemcheckbox",
			"menuitemradio",
			"option",
			"switch",
			"tab",
			"slider",
			"checkbox",
			"radio",
			"combobox",
		]) {
			expect(isInteractiveTarget(el("div", { role }))).toBe(true);
		}
		expect(isInteractiveTarget(el("li", { role: " Option " }))).toBe(true);
		expect(isInteractiveTarget(el("div", { role: "region" }))).toBe(false);
	});

	it("claims focus inside a control or a key-owning widget", () => {
		const button = el("button");
		expect(isInteractiveTarget(el("span", {}, button))).toBe(true);

		for (const role of ["menu", "listbox", "radiogroup", "tablist", "grid", "tree"]) {
			expect(isInteractiveTarget(el("div", { tabindex: "-1" }, el("div", { role })))).toBe(
				true,
			);
		}
		const popper = el("div", { "data-radix-popper-content-wrapper": "" });
		expect(isInteractiveTarget(el("div", { role: "dialog" }, popper))).toBe(true);
	});

	it("lets a list keep its keys on its own rows, but not on other controls", () => {
		const list = el("div", { role: "group" });
		const row = el(
			"a",
			{ href: "/priya-k3m/letters/1", "data-letter-row": "" },
			el("li", {}, list),
		);
		const ownItem = (element: ElementLike) => element.hasAttribute("data-letter-row");

		expect(isInteractiveTarget(row)).toBe(true);
		expect(isInteractiveTarget(row, { ownItem })).toBe(false);
		expect(isInteractiveTarget(el("button", {}, list), { ownItem })).toBe(true);
		expect(isInteractiveTarget(el("input", {}, list), { ownItem })).toBe(true);
	});
});
