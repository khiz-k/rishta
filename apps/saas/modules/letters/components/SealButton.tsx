"use client";

import { Button, cn, MonogramSeal } from "@repo/ui";
import { useReducedMotion } from "@shared/hooks/use-reduced-motion";
import { haptic } from "@shared/lib/utils";
import { useTranslations } from "next-intl";
import {
	type KeyboardEvent,
	type PointerEvent,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";

/** design.md §6.2: 600ms to press, 10px of movement cancels (it was a scroll). */
const HOLD_MS = 600;
const MOVE_TOLERANCE_PX = 10;
/** A hold let go early: the ink eases back to the centre. */
const RETURN_MS = 150;

export type SealStatus = "idle" | "sending" | "sent" | "failed";

type Phase = "ready" | "holding" | "confirm" | "pressed";

interface HoldState {
	start: number;
	x: number;
	y: number;
	source: "pointer" | "key";
	frame: number;
}

/**
 * The seal (design.md §6.2-6.3). Three equivalent ways to press it:
 * - press and hold (pointer or touch) for 600ms while the lac ink spreads from the centre of the
 *   MonogramSeal out to its marigold rim: the wax taking the seal is the progress, with no ring
 *   or gauge around it;
 * - hold Enter or Space on the focused seal (auto-repeat ignored, keyup cancels);
 * - tap, then confirm (a short press, a click, VoiceOver or TalkBack double-tap, switch access).
 * Releasing early, moving more than 10px or leaving the seal cancels and the ink eases back in
 * 150ms. At 600ms the monogram presses in: 1.04 → 1 in 220ms, one 10ms haptic. Pressed from
 * the confirm step, the ink spreads during those 220ms instead.
 */
export function SealButton({
	initials,
	recipientName,
	locked,
	lockMessageId,
	status,
	onSeal,
	onKeepWriting,
}: {
	initials: string;
	recipientName: string;
	locked: boolean;
	/** The id of the text explaining why the seal is locked (aria-describedby). */
	lockMessageId?: string;
	status: SealStatus;
	onSeal: () => void;
	onKeepWriting?: () => void;
}) {
	const t = useTranslations("composer.seal");
	const reducedMotion = useReducedMotion();
	const hintId = useId();
	const sealRef = useRef<HTMLButtonElement>(null);
	const confirmRef = useRef<HTMLButtonElement>(null);
	const holdRef = useRef<HoldState | null>(null);
	const handledByPointer = useRef(false);
	const handledByKey = useRef(false);
	const [phase, setPhase] = useState<Phase>("ready");
	const [lifting, setLifting] = useState(false);
	// The ink stays on the seal while it eases back (150ms), so a cancelled hold is seen to undo.
	const [returning, setReturning] = useState(false);
	const returnTimer = useRef<number | null>(null);
	// A full hold leaves the ink at the rim; a press from the confirm step spreads it instead.
	const [pressedByHold, setPressedByHold] = useState(false);

	const busy = status === "sending" || status === "sent";
	const inactive = locked || busy;

	/**
	 * The hold's progress (0-1) is written to `--seal-hold` on the seal every frame, without a
	 * render; MonogramSeal spreads its ink from it. `ease` returns the ink in 150ms.
	 */
	const setInk = useCallback((progress: number, ease = false) => {
		const seal = sealRef.current;
		if (!seal) {
			return;
		}
		seal.style.setProperty("--seal-hold-return", ease ? `${RETURN_MS}ms` : "0ms");
		seal.style.setProperty("--seal-hold", String(progress));
		if (returnTimer.current !== null) {
			window.clearTimeout(returnTimer.current);
			returnTimer.current = null;
		}
		if (ease) {
			setReturning(true);
			returnTimer.current = window.setTimeout(() => {
				returnTimer.current = null;
				setReturning(false);
			}, RETURN_MS);
		} else {
			setReturning(false);
		}
	}, []);

	const press = useCallback(
		(byHold: boolean) => {
			setPhase("pressed");
			setPressedByHold(byHold);
			setInk(byHold ? 1 : 0);
			// One haptic at the press, where supported, and nowhere else in the product.
			haptic();
			onSeal();
		},
		[onSeal, setInk],
	);

	const cancelHold = useCallback(
		(next: "ready" | "confirm") => {
			const hold = holdRef.current;
			if (!hold) {
				return;
			}
			cancelAnimationFrame(hold.frame);
			holdRef.current = null;
			setInk(0, !reducedMotion);
			setPhase(next);
		},
		[reducedMotion, setInk],
	);

	const startHold = useCallback(
		(source: HoldState["source"], x = 0, y = 0) => {
			if (inactive || holdRef.current) {
				return;
			}
			const hold: HoldState = { start: performance.now(), x, y, source, frame: 0 };
			holdRef.current = hold;
			setPhase("holding");
			setInk(0);
			// The ink still spreads under reduced motion: it is the timer and essential feedback.
			const tick = (now: number) => {
				if (holdRef.current !== hold) {
					return;
				}
				const progress = Math.min(1, (now - hold.start) / HOLD_MS);
				setInk(progress);
				if (progress >= 1) {
					holdRef.current = null;
					press(true);
					return;
				}
				hold.frame = requestAnimationFrame(tick);
			};
			hold.frame = requestAnimationFrame(tick);
		},
		[inactive, press, setInk],
	);

	// A failed send lifts the seal (the press reversed in 150ms); a finished one stays pressed.
	useEffect(() => {
		if (status === "failed") {
			setLifting(true);
			setPhase("ready");
			setInk(0, !reducedMotion);
			const timer = window.setTimeout(() => setLifting(false), RETURN_MS);
			return () => window.clearTimeout(timer);
		}
		if (status === "idle" && phase === "pressed") {
			setPhase("ready");
			setInk(0);
		}
		return undefined;
	}, [status]); // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps

	useEffect(
		() => () => {
			if (holdRef.current) {
				cancelAnimationFrame(holdRef.current.frame);
			}
			if (returnTimer.current !== null) {
				window.clearTimeout(returnTimer.current);
			}
		},
		[],
	);

	// The confirm step takes focus, so Enter or a double-tap seals from there.
	useEffect(() => {
		if (phase === "confirm") {
			confirmRef.current?.focus();
		}
	}, [phase]);

	const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
		// On the phone the seal sits in a vaul sheet, whose content starts a drag (and re-captures
		// the pointer) on pointerdown. A slight downward drift during the 600ms hold must never
		// move the sheet or steal the pointer from the seal, so the press stops here.
		event.stopPropagation();
		if (event.button !== 0 || inactive) {
			return;
		}
		handledByPointer.current = true;
		event.currentTarget.setPointerCapture(event.pointerId);
		startHold("pointer", event.clientX, event.clientY);
	};

	const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
		const hold = holdRef.current;
		if (!hold || hold.source !== "pointer") {
			return;
		}
		const moved = Math.hypot(event.clientX - hold.x, event.clientY - hold.y);
		const rect = event.currentTarget.getBoundingClientRect();
		const outside =
			event.clientX < rect.left ||
			event.clientX > rect.right ||
			event.clientY < rect.top ||
			event.clientY > rect.bottom;
		if (moved > MOVE_TOLERANCE_PX || outside) {
			cancelHold("ready");
		}
	};

	// The click that follows a handled press is ignored once, then the flags clear, so a later
	// assistive-technology activation is never swallowed.
	const clearHandledSoon = () => {
		window.setTimeout(() => {
			handledByPointer.current = false;
			handledByKey.current = false;
		}, 0);
	};

	const onPointerUp = () => {
		const hold = holdRef.current;
		if (hold?.source === "pointer") {
			// A short press never sends: it opens the confirm step.
			cancelHold("confirm");
		}
		clearHandledSoon();
	};

	const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
		if (event.key !== "Enter" && event.key !== " ") {
			return;
		}
		event.preventDefault();
		if (event.repeat || inactive) {
			return;
		}
		handledByKey.current = true;
		startHold("key");
	};

	const onKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
		if (event.key !== "Enter" && event.key !== " ") {
			return;
		}
		event.preventDefault();
		if (holdRef.current?.source === "key") {
			cancelHold("confirm");
		}
		clearHandledSoon();
	};

	const onClick = () => {
		// Pointer and keyboard presses are handled above; a bare click is assistive technology.
		if (handledByPointer.current || handledByKey.current) {
			handledByPointer.current = false;
			handledByKey.current = false;
			return;
		}
		if (!inactive) {
			setPhase("confirm");
		}
	};

	const sealState = locked && phase !== "pressed" ? "pending" : "pressed";
	const pressed = phase === "pressed" || busy;
	const inkFollowsHold = phase === "holding" || returning || (pressed && pressedByHold);

	return (
		<div className="gap-3 flex flex-col items-start">
			<div className="gap-4 flex items-center">
				<button
					ref={sealRef}
					type="button"
					data-vaul-no-drag
					aria-label={t("label")}
					aria-describedby={[hintId, locked ? lockMessageId : null]
						.filter(Boolean)
						.join(" ")}
					aria-disabled={inactive || undefined}
					onPointerDown={onPointerDown}
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
					onPointerCancel={() => {
						cancelHold("ready");
						clearHandledSoon();
					}}
					onLostPointerCapture={() => {
						if (holdRef.current?.source === "pointer") {
							cancelHold("ready");
						}
					}}
					onKeyDown={onKeyDown}
					onKeyUp={onKeyUp}
					onBlur={() => cancelHold("ready")}
					onClick={onClick}
					onContextMenu={(event) => event.preventDefault()}
					className={cn(
						"relative inline-flex size-[5.5rem] shrink-0 [touch-action:none] items-center justify-center rounded-full select-none [-webkit-touch-callout:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
						inactive ? "cursor-not-allowed" : "cursor-pointer",
					)}
				>
					<span className={cn("inline-flex", lifting && "animate-seal-lift")}>
						<MonogramSeal
							initials={initials}
							state={sealState}
							size={64}
							awaitingPress={!pressed}
							holding={inkFollowsHold}
							pressing={pressed && !reducedMotion}
						/>
					</span>
				</button>
				<p id={hintId} className="max-w-[14rem] text-meta text-muted-foreground">
					{busy
						? status === "sent"
							? t("sent")
							: t("sealing")
						: reducedMotion
							? t("hintReduced")
							: t("hint")}
				</p>
			</div>

			{phase === "confirm" && !inactive && (
				<div
					role="group"
					aria-label={t("confirmLabel")}
					className="gap-3 animate-slip-in flex flex-col"
				>
					<p className="font-display text-letter">
						{t("confirm", { name: recipientName })}
					</p>
					<div className="gap-2 flex flex-wrap">
						<Button
							ref={confirmRef}
							type="button"
							variant="primary"
							onClick={() => press(false)}
						>
							{t("confirmSend")}
						</Button>
						<Button
							type="button"
							variant="ghost"
							onClick={() => {
								setPhase("ready");
								onKeepWriting?.();
							}}
						>
							{t("keepWriting")}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
