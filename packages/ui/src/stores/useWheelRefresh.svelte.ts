// src/hooks/useWheelRefresh.svelte.ts

import { onDestroy } from "svelte";

interface DirectionalRefreshConfig {
	onRefresh: () => Promise<void>;
	threshold?: number;
}

interface WheelRefreshOptions {
	getScrollElement: () => HTMLElement | undefined;
	isEnabled: () => boolean;
	up?: DirectionalRefreshConfig;
	down?: DirectionalRefreshConfig;
}

export function useWheelRefresh({
	getScrollElement,
	isEnabled,
	up,
	down,
}: WheelRefreshOptions) {
	const DEFAULT_WHEEL_THRESHOLD = 7;
	const COOLDOWN_PERIOD = 1000;

	let wheelCount = $state(0);
	let wheelDirection: "up" | "down" | null = $state(null);
	let isCoolingDown = $state(false);
	let resetTimer: NodeJS.Timeout | null = null;
	let cooldownTimer: NodeJS.Timeout | null = null;
	let wheelProgress = $state({
		count: 0,
		direction: null as "up" | "down" | null,
		threshold: DEFAULT_WHEEL_THRESHOLD,
	});
	let refreshTriggerLineEl = $state<HTMLElement | undefined>();

	function resetWheelState() {
		wheelCount = 0;
		wheelDirection = null;
		wheelProgress = {
			count: 0,
			direction: null,
			threshold: DEFAULT_WHEEL_THRESHOLD,
		};
		if (resetTimer) {
			clearTimeout(resetTimer);
			resetTimer = null;
		}
	}

	const handleWheel = (e: WheelEvent) => {
		const scrollContainerEl = getScrollElement();
		// Initial checks moved from effect to handler
		if (!scrollContainerEl || !isEnabled()) {
			return;
		}

		// UX fix: allow scrolling during cooldown
		if (isCoolingDown) {
			return;
		}

		const { scrollTop, scrollHeight, clientHeight } = scrollContainerEl;
		const currentScrollDirection = e.deltaY < 0 ? "up" : "down";
		const config = currentScrollDirection === "up" ? up : down;

		if (!config) {
			return;
		}

		const buffer = 10;
		const isAtTop = scrollTop < buffer;
		const isAtBottom =
			scrollTop + clientHeight >= scrollHeight - buffer;
		const isAtEdge =
			(currentScrollDirection === "up" && isAtTop) ||
			(currentScrollDirection === "down" && isAtBottom);

		if (isAtEdge) {
			e.preventDefault();

			if (resetTimer) clearTimeout(resetTimer);
			resetTimer = setTimeout(() => {
				resetWheelState();
			}, 800);

			if (wheelDirection !== currentScrollDirection) {
				wheelDirection = currentScrollDirection;
				wheelCount = 1;
			} else {
				wheelCount += 1;
			}
			const threshold = config.threshold ?? DEFAULT_WHEEL_THRESHOLD;
			wheelProgress = {
				count: wheelCount,
				direction: wheelDirection,
				threshold: threshold,
			};

			let isTriggered = false;

			if (currentScrollDirection === "up" && isAtTop) {
				isTriggered = wheelCount >= threshold;
			} else if (
				currentScrollDirection === "down" &&
				isAtBottom &&
				down
			) {
				const isPastTriggerLine =
					!refreshTriggerLineEl ||
					(refreshTriggerLineEl &&
						scrollTop + clientHeight >=
							refreshTriggerLineEl.offsetTop);
				isTriggered = wheelCount >= threshold && isPastTriggerLine;
			}

			if (isTriggered) {
				// Explicitly clear the reset timer to prevent race conditions
				if (resetTimer) {
					clearTimeout(resetTimer);
					resetTimer = null;
				}

				isCoolingDown = true; // Set cooldown immediately
				config.onRefresh();
				resetWheelState();

				// Now just set the timer to turn it off
				if (cooldownTimer) clearTimeout(cooldownTimer);
				cooldownTimer = setTimeout(() => {
					isCoolingDown = false;
					cooldownTimer = null;
				}, COOLDOWN_PERIOD);
			}
		} else {
			resetWheelState();
		}
	};

	$effect(() => {
		const scrollContainerEl = getScrollElement();

		// Effect only adds/removes listener
		if (scrollContainerEl && isEnabled()) {
			scrollContainerEl.addEventListener("wheel", handleWheel, {
				passive: false,
			});
			return () => {
				scrollContainerEl.removeEventListener("wheel", handleWheel);
			};
		} else {
			// If disabled or element removed, reset state
			resetWheelState();
		}
	});

	onDestroy(() => {
		if (resetTimer) clearTimeout(resetTimer);
		if (cooldownTimer) clearTimeout(cooldownTimer);
	});

	return {
		get wheelProgress() {
			return wheelProgress;
		},
		get isCoolingDown() {
			return isCoolingDown;
		},
		bindRefreshTriggerLine: (el: HTMLElement) => {
			refreshTriggerLineEl = el;
		},
	};
}
