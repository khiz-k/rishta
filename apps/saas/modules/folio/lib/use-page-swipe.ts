"use client";

import { type PointerEvent as ReactPointerEvent, type RefObject, useCallback, useRef } from "react";

/** design.md §4.2: axis-locked swipes that only ever turn pages. */
const LOCK_PX = 12;
const AXIS_RATIO = 1.5;
const COMMIT_PX = 64;
const FOLLOW_MAX_PX = 24;
const FLICK_VELOCITY = 0.5; // px per ms

interface Gesture {
	pointerId: number;
	startX: number;
	startY: number;
	startTime: number;
	axis: "undecided" | "horizontal" | "vertical";
	lastDx: number;
}

/**
 * Horizontal swipes on the page count only when |dx| > 1.5·|dy| and |dx| > 12px, and commit at
 * 64px or on a flick. The page follows the finger at most 24px: no tilt, no overlay, and never a
 * decision. Touch and pen only (a mouse drag selects text). Reduced motion: no follow at all.
 */
export function usePageSwipe({
	targetRef,
	onPrevious,
	onNext,
	reducedMotion,
	disabled,
}: {
	targetRef: RefObject<HTMLElement | null>;
	onPrevious: () => void;
	onNext: () => void;
	reducedMotion: boolean;
	disabled?: boolean;
}) {
	const gesture = useRef<Gesture | null>(null);

	const follow = useCallback(
		(dx: number) => {
			const element = targetRef.current;
			if (!element || reducedMotion) {
				return;
			}
			const clamped = Math.max(-FOLLOW_MAX_PX, Math.min(FOLLOW_MAX_PX, dx * 0.35));
			element.style.transition = "none";
			element.style.transform = clamped === 0 ? "" : `translateX(${clamped}px)`;
		},
		[targetRef, reducedMotion],
	);

	const settle = useCallback(() => {
		const element = targetRef.current;
		if (!element) {
			return;
		}
		element.style.transition = reducedMotion ? "none" : "transform 150ms ease-out";
		element.style.transform = "";
	}, [targetRef, reducedMotion]);

	const onPointerDown = useCallback(
		(event: ReactPointerEvent<HTMLElement>) => {
			if (disabled || event.pointerType === "mouse" || !event.isPrimary) {
				return;
			}
			gesture.current = {
				pointerId: event.pointerId,
				startX: event.clientX,
				startY: event.clientY,
				startTime: performance.now(),
				axis: "undecided",
				lastDx: 0,
			};
		},
		[disabled],
	);

	const onPointerMove = useCallback(
		(event: ReactPointerEvent<HTMLElement>) => {
			const current = gesture.current;
			if (!current || current.pointerId !== event.pointerId) {
				return;
			}
			const dx = event.clientX - current.startX;
			const dy = event.clientY - current.startY;
			if (current.axis === "undecided") {
				if (Math.abs(dy) > LOCK_PX && Math.abs(dy) >= Math.abs(dx)) {
					current.axis = "vertical";
					return;
				}
				if (Math.abs(dx) > LOCK_PX && Math.abs(dx) > AXIS_RATIO * Math.abs(dy)) {
					current.axis = "horizontal";
				} else {
					return;
				}
			}
			if (current.axis === "horizontal") {
				current.lastDx = dx;
				follow(dx);
			}
		},
		[follow],
	);

	const finish = useCallback(
		(event: ReactPointerEvent<HTMLElement>, cancelled: boolean) => {
			const current = gesture.current;
			if (!current || current.pointerId !== event.pointerId) {
				return;
			}
			gesture.current = null;
			settle();
			if (cancelled || current.axis !== "horizontal") {
				return;
			}
			const dx = event.clientX - current.startX;
			const elapsed = Math.max(1, performance.now() - current.startTime);
			const velocity = Math.abs(dx) / elapsed;
			if (
				Math.abs(dx) >= COMMIT_PX ||
				(velocity > FLICK_VELOCITY && Math.abs(dx) > LOCK_PX * 2)
			) {
				if (dx < 0) {
					onNext();
				} else {
					onPrevious();
				}
			}
		},
		[onNext, onPrevious, settle],
	);

	return {
		onPointerDown,
		onPointerMove,
		onPointerUp: (event: ReactPointerEvent<HTMLElement>) => finish(event, false),
		onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => finish(event, true),
	};
}
