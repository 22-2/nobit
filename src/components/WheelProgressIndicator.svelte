<script lang="ts">
    import type { WheelState } from "src/store/useWheelRefresh.svelte.ts";
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
        top: var(--size-4-4);
        left: 50%;
        transform: translateX(-50%);
        z-index: var(--layer-tooltip);
        user-select: none;
        position: fixed;
    }

    .indicator-content {
        display: flex;
        align-items: center;
        gap: var(--size-4-2);
        background-color: var(--background-secondary);
        color: var(--text-normal);
        border-radius: var(--radius-l);
        padding: var(--size-2-3) var(--size-4-3);
        font-size: var(--font-ui-medium);
        font-weight: var(--font-semibold);
        box-shadow: var(--shadow-s);
        border: var(--border-width) solid
            var(--background-modifier-border);
    }

    .wheel-progress-indicator.bottom {
        top: unset;
        bottom: var(--size-4-8);
    }

    .icon {
        line-height: 1;
        height: var(--size-4-4);
        width: var(--size-4-4);
    }

    .progress-bar-wrapper {
        width: var(--size-4-12);
        height: var(--size-4-2);
        background-color: var(--background-modifier-border);
        border-radius: var(--radius-s);
        overflow: hidden;
    }

    .progress-bar {
        height: 100%;
        background-color: var(--interactive-accent);
        transition: width 0.1s linear;
        border-radius: var(--radius-s);
    }
</style>
