<!-- E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\view\common\WheelProgressIndicator.svelte -->
<script lang="ts">
    import type { WheelState } from "../../stores/useWheelRefresh.svelte.ts";

    let { wheelState, position = "top" } = $props<{
        wheelState: WheelState;
        position?: "top" | "bottom";
    }>();

    let shouldBeVisible = $derived(
        (wheelState.count > 0 && wheelState.status === "wheeling") ||
            wheelState.status === "success"
    );

    let label = $derived(
        wheelState.status === "success"
            ? "✅️"
            : wheelState.direction === "up"
              ? "↑"
              : "↓"
    );
</script>

<div
    class="wheel-progress-indicator"
    class:bottom={position === "bottom"}
    class:post-refresh={wheelState.status === "success"}
    style="visibility: {shouldBeVisible ? 'visible' : 'hidden'};"
>
    {#if wheelState.status !== "idle"}
        {label}
        <span class="progress-bar-wrapper">
            <div
                class="progress-bar"
                style="width: {wheelState.status === 'success'
                    ? '100%'
                    : Math.min(
                          (wheelState.count / wheelState.threshold) * 100,
                          100
                      )}%;"
            ></div>
        </span>
    {/if}
</div>

<style>
    .wheel-progress-indicator {
        position: absolute;
        top: var(--nobit-size-4-4);
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--nobit-background-secondary);
        color: var(--nobit-text-normal);
        border-radius: var(--nobit-radius-l);
        padding: var(--nobit-size-2-3) var(--nobit-size-4-3);
        font-size: var(--nobit-font-ui-medium);
        font-weight: var(--nobit-font-semibold);
        box-shadow: var(--nobit-shadow-s);
        z-index: var(--nobit-layer-tooltip);
        user-select: none;
        display: flex;
        align-items: center;
        gap: var(--nobit-size-4-2);
        border: var(--nobit-border-width) solid
            var(--nobit-background-modifier-border);
        transition:
            opacity 0.2s,
            visibility 0.2s;
    }
    /*
    .wheel-progress-indicator[style*="visibility: visible"] {
        opacity: 0.9;
        animation: fade-in 0.2s ease-out forwards;
    }
    .wheel-progress-indicator[style*="visibility: hidden"] {
        opacity: 0;
        pointer-events: none;
    } */

    .wheel-progress-indicator.bottom {
        top: unset;
        bottom: var(--nobit-size-4-8);
    }

    .wheel-progress-indicator.refreshing {
        padding: var(--nobit-size-4-2);
    }

    .wheel-progress-indicator.post-refresh {
        background-color: var(--nobit-interactive-accent);
        color: white;
        animation: success-pulse 0.5s ease-out;
    }

    .wheel-progress-indicator.post-refresh .progress-bar-wrapper {
        display: none;
    }

    .progress-bar-wrapper {
        width: var(--nobit-size-4-12);
        height: var(--nobit-size-4-2);
        background-color: var(--nobit-background-modifier-border);
        border-radius: var(--nobit-radius-s);
        overflow: hidden;
    }

    .progress-bar {
        height: 100%;
        background-color: var(--nobit-interactive-accent);
        transition: width 0.1s linear;
        border-radius: var(--nobit-radius-s);
    }

    @keyframes fade-in {
        from {
            opacity: 0;
            transform: translate(-50%, calc(-1 * var(--nobit-size-2-3)));
        }
        to {
            opacity: 0.9;
            transform: translate(-50%, 0);
        }
    }

    @keyframes success-pulse {
        0% {
            transform: translate(-50%, 0) scale(1);
        }
        50% {
            transform: translate(-50%, 0) scale(1.1);
        }
        100% {
            transform: translate(-50%, 0) scale(1);
        }
    }
</style>
