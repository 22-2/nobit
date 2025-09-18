<!-- src/components/WheelProgressIndicator.svelte -->
<script lang="ts">
    import type { WheelState } from "../stores/useWheelRefresh.svelte.ts";

    let { wheelState, position = "top" } = $props<{
        wheelState: WheelState;
        position?: "top" | "bottom";
    }>();
</script>

{#if (wheelState.count > 0 && !wheelState.isCoolingDown) || wheelState.isShowingPostRefresh}
    <div
        class="wheel-progress-indicator"
        class:bottom={position === "bottom"}
        class:post-refresh={wheelState.isShowingPostRefresh}
    >
        {#if wheelState.isShowingPostRefresh}
            ✓
        {:else}
            {wheelState.direction === "up" ? "↑" : "↓"}
        {/if}
        <span class="progress-bar-wrapper">
            <div
                class="progress-bar"
                style="width: {wheelState.isShowingPostRefresh
                    ? 100
                    : Math.min(
                          (wheelState.count / wheelState.threshold) * 100,
                          100
                      )}%;"
            ></div>
        </span>
    </div>
{/if}

<style>
    .wheel-progress-indicator {
        position: absolute;
        top: 1em;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--background-secondary);
        color: var(--text-normal);
        border-radius: var(--radius-l);
        padding: 0.3em 0.8em;
        font-size: 1.2em;
        font-weight: bold;
        box-shadow: var(--shadow-s);
        z-index: 100;
        opacity: 0;
        animation: fade-in 0.2s ease-out forwards;
        user-select: none;
        display: flex;
        align-items: center;
        gap: 0.5em;
        border: 1px solid var(--background-modifier-border);
    }

    .wheel-progress-indicator.bottom {
        top: unset;
        bottom: 3em;
    }

    .wheel-progress-indicator.refreshing {
        padding: 0.5em;
    }

    .wheel-progress-indicator.post-refresh {
        background-color: var(--interactive-accent);
        color: white;
        animation: success-pulse 0.5s ease-out;
    }

    .progress-bar-wrapper {
        width: 50px;
        height: 8px;
        background-color: var(--background-modifier-border);
        border-radius: 4px;
        overflow: hidden;
    }

    .progress-bar {
        height: 100%;
        background-color: var(--interactive-accent);
        transition: width 0.1s linear;
    }

    @keyframes fade-in {
        from {
            opacity: 0;
            transform: translate(-50%, -10px);
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
