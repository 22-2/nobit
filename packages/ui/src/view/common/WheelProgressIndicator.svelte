<script lang="ts">
    import type { WheelState } from "../../stores/useWheelRefresh.svelte.ts";
    import { fade } from "svelte/transition";
    import LoadingSpinner from "./LoadingSpinner.svelte";

    let { wheelState, position = "top" } = $props<{
        wheelState: WheelState;
        position?: "top" | "bottom";
    }>();

    let shouldBeVisible = $derived(
        (wheelState.count > 0 && wheelState.status === "wheeling") ||
            wheelState.status === "refreshing" ||
            wheelState.status === "success" ||
            wheelState.status === "error"
    );
</script>

{#if shouldBeVisible}
    <div
        class="wheel-progress-indicator"
        class:bottom={position === "bottom"}
        transition:fade={{ duration: 100 }}
    >
        <div class="indicator-content">
            {#if wheelState.status === "refreshing"}
                <LoadingSpinner size="small" strokeWidth={2.5} />
            {:else if wheelState.status === "success"}
                <span class="icon">✅️</span>
            {:else if wheelState.status === "error"}
                <span class="icon">❌</span>
            {:else if wheelState.direction === "up"}
                <span class="icon">↑</span>
            {:else if wheelState.direction === "down"}
                <span class="icon">↓</span>
            {/if}

            <span class="progress-bar-wrapper">
                <div
                    class="progress-bar"
                    style="
                width: {wheelState.status === 'success'
                        ? '100%'
                        : Math.min(
                              (wheelState.count / wheelState.threshold) * 100,
                              100
                          )}%;"
                ></div>
            </span>
        </div>
    </div>
{/if}

<style>
    .wheel-progress-indicator {
        position: absolute;
        top: var(--nobit-size-4-4);
        left: 50%;
        transform: translateX(-50%);
        z-index: var(--nobit-layer-tooltip);
        user-select: none;
    }

    .indicator-content {
        display: flex;
        align-items: center;
        gap: var(--nobit-size-4-2);
        background-color: var(--nobit-background-secondary);
        color: var(--nobit-text-normal);
        border-radius: var(--nobit-radius-l);
        padding: var(--nobit-size-2-3) var(--nobit-size-4-3);
        font-size: var(--nobit-font-ui-medium);
        font-weight: var(--nobit-font-semibold);
        box-shadow: var(--nobit-shadow-s);
        border: var(--nobit-border-width) solid
            var(--nobit-background-modifier-border);
    }

    .wheel-progress-indicator.bottom {
        top: unset;
        bottom: var(--nobit-size-4-8);
    }

    .icon {
        line-height: 1;
        height: var(--nobit-size-4-4);
        width: var(--nobit-size-4-4);
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
</style>
