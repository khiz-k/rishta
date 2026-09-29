"use client";

import { isInteractiveTarget } from "@shared/lib/interactive-target";
import { useEffect, useRef } from "react";

export interface ReaderKeyHandlers {
	previous: () => void;
	next: () => void;
	keep?: () => void;
	pass?: () => void;
	write?: () => void;
	why?: () => void;
	family?: () => void;
}

function aDialogIsOpen() {
	return Boolean(
		document.querySelector(
			'[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [data-vaul-drawer][data-state="open"], [role="menu"][data-state="open"], [role="listbox"][data-state="open"]',
		),
	);
}

/**
 * design.md §4.4. ← → (and [ ]) turn pages; K keep, P pass, W write a note, Y why this page,
 * F show my family. No shortcut fires, or calls preventDefault, while focus is on a control or a
 * text field, inside a menu, list or radio group (`isInteractiveTarget`), or over an open sheet
 * or menu. Single-letter shortcuts can be turned off in Settings (WCAG 2.1.4).
 */
export function useReaderKeys(handlers: ReaderKeyHandlers, lettersEnabled: boolean) {
	const ref = useRef(handlers);
	useEffect(() => {
		ref.current = handlers;
	});

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
				return;
			}
			if (isInteractiveTarget(event.target) || aDialogIsOpen()) {
				return;
			}
			const current = ref.current;
			switch (event.key) {
				case "ArrowLeft":
				case "[":
					event.preventDefault();
					current.previous();
					return;
				case "ArrowRight":
				case "]":
					event.preventDefault();
					current.next();
					return;
			}
			if (!lettersEnabled || event.shiftKey) {
				return;
			}
			const map: Record<string, (() => void) | undefined> = {
				k: current.keep,
				p: current.pass,
				w: current.write,
				y: current.why,
				f: current.family,
			};
			const action = map[event.key.toLowerCase()];
			if (action) {
				event.preventDefault();
				action();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [lettersEnabled]);
}
