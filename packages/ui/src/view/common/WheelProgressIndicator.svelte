<script lang="ts">
    import type { WheelState } from "../../stores/useWheelRefresh.svelte.ts";
    import { fade } from "svelte/transition";

    let { wheelState, position = "top" } = $props<{
        wheelState: WheelState;
        position?: "top" | "bottom";
    }>();

    let shouldBeVisible = $derived(
        (wheelState.count > 0 && wheelState.status === "wheeling") ||
            wheelState.status === "success"
    );

    let isSuccessAnimationDone = $state(false);
    let lockedDirection = $state<"up" | "down" | null>(null);

    // wheelState の変化に応じて状態を更新する
    $effect(() => {
        // wheeling 状態が始まったら、方向をロックするだけ
        if (wheelState.status === "wheeling" && lockedDirection === null) {
            lockedDirection = wheelState.direction;
        }

        // success 状態から抜けたらアニメーション完了フラグをリセット
        if (wheelState.status !== "success") {
            isSuccessAnimationDone = false;
        }
    });

    // プログレスバーの transition が完了した時に呼ばれる関数
    function handleTransitionEnd() {
        if (wheelState.status === "success") {
            isSuccessAnimationDone = true;
        }
    }

    // ▼▼▼ ここからが変更点 ▼▼▼
    // コンポーネントが画面から完全に消えた後に呼ばれる関数
    function handleOutroEnd() {
        // 次の表示に備えて、ここで初めてロックを解除する
        lockedDirection = null;
    }
    // ▲▲▲ ここまでが変更点 ▲▲▲

    let label = $derived(
        isSuccessAnimationDone
            ? "✅️"
            : (lockedDirection ?? wheelState.direction) === "up"
              ? "↑"
              : "↓"
    );
</script>

<!-- HTML部分の on:outroend に注目 -->
<div
    class="wheel-progress-indicator"
    class:bottom={position === "bottom"}
    class:post-refresh={isSuccessAnimationDone}
    style="visibility: {shouldBeVisible ? 'visible' : 'hidden'}"
    transition:fade={{ duration: 50 }}
    on:outroend={handleOutroEnd}
>
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
            on:transitionend={handleTransitionEnd}
        ></div>
    </span>
</div>

<style>
    /* styleタグの中は変更なしでOKです */
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
    }

    .wheel-progress-indicator.bottom {
        top: unset;
        bottom: var(--nobit-size-4-8);
    }

    .wheel-progress-indicator.refreshing {
        padding: var(--nobit-size-4-2);
    }

    /*
        もしこのスタイルを有効にする場合、
        class:post-refresh={isSuccessAnimationDone} に変更したことで
        アニメーション完了後に適用されるようになります
    */
    .wheel-progress-indicator.post-refresh {
        /* background-color: var(--nobit-interactive-accent);
        color: white;
        animation: success-pulse 0.5s ease-out; */
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
