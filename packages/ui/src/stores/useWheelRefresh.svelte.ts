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
  let resetTimer: number | null = null;
  let cooldownTimer: number | null = null;
  let wheelProgress = $state({
    count: 0,
    direction: null as "up" | "down" | null,
    threshold: DEFAULT_WHEEL_THRESHOLD,
  });
  let refreshTriggerLineEl = $state<HTMLElement | undefined>();

  function resetWheelState() {
    wheelCount = 0;
    wheelDirection = null;

    // ★★★ 修正箇所 ★★★
    // オブジェクトを再代入するのではなく、プロパティを直接更新する
    wheelProgress.count = 0;
    wheelProgress.direction = null;
    wheelProgress.threshold = DEFAULT_WHEEL_THRESHOLD;

    if (resetTimer) {
      clearTimeout(resetTimer);
      resetTimer = null;
    }
  }

  const handleWheel = (e: WheelEvent) => {
    const scrollContainerEl = getScrollElement();
    if (!scrollContainerEl || !isEnabled()) {
      return;
    }

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
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - buffer;
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

      // ★★★ 修正箇所 ★★★
      // こちらも同様に、プロパティを直接更新する
      wheelProgress.count = wheelCount;
      wheelProgress.direction = wheelDirection;
      wheelProgress.threshold = threshold;

      let isTriggered = false;

      if (currentScrollDirection === "up" && isAtTop) {
        isTriggered = wheelCount >= threshold;
      } else if (currentScrollDirection === "down" && isAtBottom && down) {
        const isPastTriggerLine =
          !refreshTriggerLineEl ||
          (refreshTriggerLineEl &&
            scrollTop + clientHeight >= refreshTriggerLineEl.offsetTop);
        isTriggered = wheelCount >= threshold && isPastTriggerLine;
      }

      if (isTriggered) {
        if (resetTimer) {
          clearTimeout(resetTimer);
          resetTimer = null;
        }

        isCoolingDown = true;
        config.onRefresh();
        resetWheelState();

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

    if (scrollContainerEl && isEnabled()) {
      scrollContainerEl.addEventListener("wheel", handleWheel, {
        passive: false,
      });
      return () => {
        scrollContainerEl.removeEventListener("wheel", handleWheel);
      };
    } else {
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
