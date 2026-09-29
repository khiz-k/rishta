"use client";

import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";

/**
 * The shell's moving parts (design.md §4.2): the phone's top-line context ("Friday folio · 3 of
 * 7"), the bottom stack (a reader's MarginBar above the text-only BottomBar), the BottomBar
 * sliding away while a reader scrolls down, and the whole stack hiding when the soft keyboard
 * opens.
 */
interface ShellContextValue {
	contextLine: string | null;
	setContextLine: (value: string | null) => void;
	/** The BottomBar has slid away (reader scrolling down). */
	chromeHidden: boolean;
	/** The soft keyboard is open (composer, editor): the bottom stack hides. */
	keyboardOpen: boolean;
	slot: HTMLDivElement | null;
	registerSlot: (element: HTMLDivElement | null) => void;
	/** How many readers have put a bar into the slot (auto-hide only runs for readers). */
	slotUsers: number;
	claimSlot: () => () => void;
	hasBottomBar: boolean;
}

const ShellContext = createContext<ShellContextValue | null>(null);

const SCROLL_DELTA = 8;

export function ShellProvider({
	children,
	hasBottomBar,
}: PropsWithChildren<{ hasBottomBar: boolean }>) {
	const [contextLine, setContextLine] = useState<string | null>(null);
	const [chromeHidden, setChromeHidden] = useState(false);
	const [keyboardOpen, setKeyboardOpen] = useState(false);
	const [slot, setSlot] = useState<HTMLDivElement | null>(null);
	const [slotUsers, setSlotUsers] = useState(0);
	const lastY = useRef(0);

	const claimSlot = useCallback(() => {
		setSlotUsers((count) => count + 1);
		return () => setSlotUsers((count) => Math.max(0, count - 1));
	}, []);

	// The BottomBar slides away on scroll-down in a reader, and returns on scroll-up or at the end.
	useEffect(() => {
		if (slotUsers === 0) {
			setChromeHidden(false);
			return;
		}
		lastY.current = window.scrollY;
		const onScroll = () => {
			const y = window.scrollY;
			const atEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 24;
			if (atEnd || y < 64) {
				setChromeHidden(false);
			} else if (y > lastY.current + SCROLL_DELTA) {
				setChromeHidden(true);
			} else if (y < lastY.current - SCROLL_DELTA) {
				setChromeHidden(false);
			}
			if (Math.abs(y - lastY.current) > SCROLL_DELTA) {
				lastY.current = y;
			}
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, [slotUsers]);

	// The soft keyboard: the visual viewport shrinks well below the layout viewport.
	useEffect(() => {
		const viewport = window.visualViewport;
		if (!viewport) {
			return;
		}
		const onResize = () => {
			setKeyboardOpen(window.innerHeight - viewport.height > 150);
		};
		viewport.addEventListener("resize", onResize);
		return () => viewport.removeEventListener("resize", onResize);
	}, []);

	const value = useMemo(
		() => ({
			contextLine,
			setContextLine,
			chromeHidden,
			keyboardOpen,
			slot,
			registerSlot: setSlot,
			slotUsers,
			claimSlot,
			hasBottomBar,
		}),
		[contextLine, chromeHidden, keyboardOpen, slot, slotUsers, claimSlot, hasBottomBar],
	);

	return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
	return useContext(ShellContext);
}

/**
 * Sets the phone top line's context ("Friday folio · 3 of 7") while a screen is shown.
 * `undefined` leaves it to a child (the reader sets its own position).
 */
export function useShellContextLine(value: string | null | undefined) {
	const shell = useShell();
	const setContextLine = shell?.setContextLine;
	useEffect(() => {
		if (value === undefined) {
			return;
		}
		setContextLine?.(value);
		return () => setContextLine?.(null);
	}, [value, setContextLine]);
}

/**
 * Puts bars (the MarginBar, the Why-this-page handle) into the phone's bottom stack, directly
 * above the BottomBar. Link pages provide their own slot (LinkShell), with no BottomBar under it.
 */
export function BottomSlot({ children }: PropsWithChildren) {
	const shell = useShell();
	const claimSlot = shell?.claimSlot;

	useEffect(() => claimSlot?.(), [claimSlot]);

	if (!shell?.slot) {
		return null;
	}
	return createPortal(children, shell.slot);
}
