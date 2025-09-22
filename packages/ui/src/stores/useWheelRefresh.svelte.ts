// E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\stores\useWheelRefresh.svelte.ts
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

export type WheelStatus =
    | "idle"
    | "wheeling"
    | "refreshing"
    | "success"
    | "error";

export interface WheelState {
    status: WheelStatus;
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

type WheelDirection = "up" | "down";

export function useWheelRefresh({
    getScrollElement,
    isEnabled,
    up,
    down,
}: WheelRefreshOptions) {
    const DEFAULT_WHEEL_THRESHOLD = 7;
    const RESET_DELAY = 800;
    const EDGE_BUFFER = 10;
    const SUCCESS_DISPLAY_DURATION = 800;
    const ERROR_DISPLAY_DURATION = 1500;

    let wheelState = $state<WheelState>({
        status: "idle",
        count: 0,
        direction: null,
        threshold: DEFAULT_WHEEL_THRESHOLD,
    });
    let resetTimer: ReturnType<typeof setTimeout> | null = null;
    let transitionTimer: ReturnType<typeof setTimeout> | null = null;
    let refreshTriggerLineEl = $state<HTMLElement | undefined>();

    function clearTimer(timer: ReturnType<typeof setTimeout> | null): void {
        if (timer) clearTimeout(timer);
    }

    function startTransitionToIdle(
        newStatus: "success" | "error",
        duration: number
    ): void {
        wheelState.status = newStatus;
        wheelState.count = 0;
        wheelState.direction = null;

        clearTimer(transitionTimer);
        transitionTimer = setTimeout(() => {
            if (wheelState.status === newStatus) {
                wheelState.status = "idle";
            }
            transitionTimer = null;
        }, duration);
    }

    function resetWheelState(): void {
        if (
            wheelState.status === "success" ||
            wheelState.status === "refreshing" ||
            wheelState.status === "error"
        ) {
            return;
        }
        wheelState.status = "idle";
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

    function isAtScrollEdge(
        direction: WheelDirection,
        scrollInfo: ScrollInfo
    ): boolean {
        return (
            (direction === "up" && scrollInfo.isAtTop) ||
            (direction === "down" && scrollInfo.isAtBottom)
        );
    }

    function updateWheelStateForWheeling(
        direction: WheelDirection,
        config: DirectionalRefreshConfig
    ): void {
        if (wheelState.status === "idle") {
            wheelState.status = "wheeling";
        }
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
            const isPastTriggerLine =
                !refreshTriggerLineEl ||
                scrollInfo.scrollTop + scrollInfo.clientHeight >=
                    refreshTriggerLineEl.offsetTop;
            return wheelState.count >= threshold && isPastTriggerLine;
        }

        return false;
    }

    function scheduleReset(): void {
        clearTimer(resetTimer);
        resetTimer = setTimeout(resetWheelState, RESET_DELAY);
    }

    async function triggerRefresh(
        config: DirectionalRefreshConfig
    ): Promise<void> {
        clearTimer(resetTimer);
        resetTimer = null;

        wheelState.status = "refreshing";

        try {
            await config.onRefresh();
            startTransitionToIdle("success", SUCCESS_DISPLAY_DURATION);
        } catch (err) {
            console.error("Refresh action failed:", err);
            startTransitionToIdle("error", ERROR_DISPLAY_DURATION);
        }
    }

    async function handleWheelAtEdge(
        e: WheelEvent,
        direction: WheelDirection,
        config: DirectionalRefreshConfig,
        scrollInfo: ScrollInfo
    ): Promise<void> {
        e.preventDefault();
        scheduleReset();
        updateWheelStateForWheeling(direction, config);

        if (shouldTriggerRefresh(direction, scrollInfo, wheelState.threshold)) {
            await triggerRefresh(config);
        }
    }

    const handleWheel = async (e: WheelEvent) => {
        const scrollContainerEl = getScrollElement();
        if (
            !scrollContainerEl ||
            !isEnabled() ||
            wheelState.status === "refreshing" ||
            wheelState.status === "success" ||
            wheelState.status === "error"
        ) {
            return;
        }

        const direction = getWheelDirection(e.deltaY);
        const config = direction === "up" ? up : down;

        if (!config) {
            return;
        }

        const scrollInfo = getScrollInfo(scrollContainerEl);

        if (isAtScrollEdge(direction, scrollInfo)) {
            await handleWheelAtEdge(e, direction, config, scrollInfo);
        } else if (wheelState.status === "wheeling") {
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
            if (
                wheelState.status !== "refreshing" &&
                wheelState.status !== "success" &&
                wheelState.status !== "error"
            ) {
                resetWheelState();
            }
        }
    });

    onDestroy(() => {
        clearTimer(resetTimer);
        clearTimer(transitionTimer);
    });

    return {
        get wheelState() {
            return wheelState;
        },
        bindRefreshTriggerLine: (el: HTMLElement) => {
            refreshTriggerLineEl = el;
        },
    };
}
