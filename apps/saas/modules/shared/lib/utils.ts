/**
 * Calculate age from date of birth string (YYYY-MM-DD)
 */
export function calcAge(dob: string): number {
	const birth = new Date(dob);
	const today = new Date();
	let age = today.getFullYear() - birth.getFullYear();
	if (
		today.getMonth() < birth.getMonth() ||
		(today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
	) {
		age--;
	}
	return age;
}

/**
 * Get a consistent gradient class for an avatar based on name
 */
export function avatarGradient(name: string): string {
	const gradients = [
		"from-rose-400 to-pink-600",
		"from-violet-400 to-purple-600",
		"from-amber-400 to-orange-600",
		"from-emerald-400 to-teal-600",
		"from-blue-400 to-indigo-600",
		"from-fuchsia-400 to-pink-600",
		"from-red-400 to-rose-600",
		"from-cyan-400 to-blue-600",
	];
	return gradients[name.charCodeAt(0) % gradients.length]!;
}

/**
 * Singleton AudioContext for sound effects — prevents browser limit exhaustion
 */
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
	if (typeof window === "undefined") return null;
	if (!audioCtx || audioCtx.state === "closed") {
		try {
			audioCtx = new AudioContext();
		} catch {
			return null;
		}
	}
	// Resume if suspended (autoplay policy)
	if (audioCtx.state === "suspended") {
		audioCtx.resume();
	}
	return audioCtx;
}

export function playSound(type: "whoosh" | "ding" | "pop") {
	const ctx = getAudioContext();
	if (!ctx) return;

	try {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);

		if (type === "whoosh") {
			osc.type = "sine";
			osc.frequency.setValueAtTime(400, ctx.currentTime);
			osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
			gain.gain.setValueAtTime(0.08, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
			osc.start();
			osc.stop(ctx.currentTime + 0.15);
		} else if (type === "ding") {
			osc.type = "sine";
			osc.frequency.setValueAtTime(880, ctx.currentTime);
			osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.05);
			gain.gain.setValueAtTime(0.12, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
			osc.start();
			osc.stop(ctx.currentTime + 0.3);
		} else {
			osc.type = "sine";
			osc.frequency.setValueAtTime(600, ctx.currentTime);
			gain.gain.setValueAtTime(0.06, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
			osc.start();
			osc.stop(ctx.currentTime + 0.1);
		}
	} catch {
		/* silent fail */
	}
}

/**
 * Trigger haptic feedback on supported devices
 */
export function haptic() {
	if (typeof navigator !== "undefined" && "vibrate" in navigator) {
		navigator.vibrate(10);
	}
}
