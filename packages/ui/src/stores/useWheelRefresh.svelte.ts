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

type WheelDirection = "up" | "down";

interface WheelState {
  count: number;
  direction: WheelDirection | null;
  threshold: number;
}

interface ScrollInfo {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  isAtTop: boolean;
  isAtBottom: boolean;
}

export function useWheelRefresh({
  getScrollElement,
  isEnabled,
  up,
  down,
}: WheelRefreshOptions) {
  const DEFAULT_WHEEL_THRESHOLD = 7;
  const COOLDOWN_PERIOD = 1000;
  const RESET_DELAY = 800;
  const EDGE_BUFFER = 10;

  let wheelState = $state<WheelState>({
    count: 0,
    direction: null,
    threshold: DEFAULT_WHEEL_THRESHOLD,
  });
  let isCoolingDown = $state(false);
  let resetTimer: number | null = null;
  let cooldownTimer: number | null = null;
  let refreshTriggerLineEl = $state<HTMLElement | undefined>();

  function clearTimer(timer: number | null): void {
    if (timer) clearTimeout(timer);
  }

  function resetWheelState(): void {
    wheelState.count = 0;
    wheelState.direction = null;
    wheelState.threshold = DEFAULT_WHEEL_THRESHOLD;
    clearTimer(resetTimer);
    resetTimer = null;
  }

  function getScrollInfo(element: HTMLElement): ScrollInfo {
    const { scrollTop, scrollHeight, clientHeight } = element;
    return {
      scrollTop,
      scrollHeight,
      clientHeight,
      isAtTop: scrollTop < EDGE_BUFFER,
      isAtBottom: scrollTop + clientHeight >= scrollHeight - EDGE_BUFFER,
    };
  }

  function getWheelDirection(deltaY: number): WheelDirection {
    return deltaY < 0 ? "up" : "down";
  }

  function isAtScrollEdge(direction: WheelDirection, scrollInfo: ScrollInfo): boolean {
    return (direction === "up" && scrollInfo.isAtTop) || 
           (direction === "down" && scrollInfo.isAtBottom);
  }

  function updateWheelCount(direction: WheelDirection, config: DirectionalRefreshConfig): void {
    if (wheelState.direction !== direction) {
      wheelState.direction = direction;
      wheelState.count = 1;
    } else {
      wheelState.count += 1;
    }
    wheelState.threshold = config.threshold ?? DEFAULT_WHEEL_THRESHOLD;
  }

  function shouldTriggerRefresh(
    direction: WheelDirection,
    scrollInfo: ScrollInfo,
    threshold: number
  ): boolean {
    if (direction === "up") {
      return wheelState.count >= threshold;
    }
    
    if (direction === "down") {
      const isPastTriggerLine = !refreshTriggerLineEl || 
        scrollInfo.scrollTop + scrollInfo.clientHeight >= refreshTriggerLineEl.offsetTop;
      return wheelState.count >= threshold && isPastTriggerLine;
    }
    
    return false;
  }

  function startCooldown(): void {
    isCoolingDown = true;
    clearTimer(cooldownTimer);
    cooldownTimer = setTimeout(() => {
      isCoolingDown = false;
      cooldownTimer = null;
    }, COOLDOWN_PERIOD);
  }

  function scheduleReset(): void {
    clearTimer(resetTimer);
    resetTimer = setTimeout(resetWheelState, RESET_DELAY);
  }

  function triggerRefresh(config: DirectionalRefreshConfig): void {
    clearTimer(resetTimer);
    resetTimer = null;
    config.onRefresh();
    resetWheelState();
    startCooldown();
  }

  function handleWheelAtEdge(
    e: WheelEvent,
    direction: WheelDirection,
    config: DirectionalRefreshConfig,
    scrollInfo: ScrollInfo
  ): void {
    e.preventDefault();
    scheduleReset();
    updateWheelCount(direction, config);

    if (shouldTriggerRefresh(direction, scrollInfo, wheelState.threshold)) {
      triggerRefresh(config);
    }
  }

  const handleWheel = (e: WheelEvent) => {
    const scrollContainerEl = getScrollElement();
    if (!scrollContainerEl || !isEnabled() || isCoolingDown) {
      return;
    }

    const direction = getWheelDirection(e.deltaY);
    const config = direction === "up" ? up : down;
    
    if (!config) {
      return;
    }

    const scrollInfo = getScrollInfo(scrollContainerEl);
    
    if (isAtScrollEdge(direction, scrollInfo)) {
      handleWheelAtEdge(e, direction, config, scrollInfo);
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
    clearTimer(resetTimer);
    clearTimer(cooldownTimer);
  });

  return {
    get wheelProgress() {
      return wheelState;
    },
    get isCoolingDown() {
      return isCoolingDown;
    },
    bindRefreshTriggerLine: (el: HTMLElement) => {
      refreshTriggerLineEl = el;
    },
  };
}
