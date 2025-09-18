<!-- src/components/WheelProgressIndicator.svelte -->
<script lang="ts">
    import type { WheelState } from "../stores/useWheelRefresh.svelte.ts";

    let { wheelState, position = "top" } = $props<{
        wheelState: WheelState;
        position?: "top" | "bottom";
    }>();

    // コンポーネントが本当に表示されるべきかどうかの結合条件を $derived で定義
    // これにより、CSSのvisibilityプロパティでこの状態を直接反映できる
    let shouldBeVisible = $derived(
        (wheelState.count > 0 && !wheelState.isCoolingDown) ||
            wheelState.isShowingPostRefresh
    );
</script>

//
E:\Desktop\coding\my-projects-02\nobit\packages\ui\src\components\WheelProgressIndicator.svelte
<!-- #if は残しておき、visibility は CSS で制御するようにします -->
<!-- ただし、 visibility: hidden は opacity: 0 と同様に要素のスペースは確保される点に注意 -->
<!-- もし完全にレイアウトから消したいなら、結局 #if を調整する必要があるかもしれません -->

<!-- ここでの変更はあくまで visibility スタイルでの制御に限定します -->
<div
    class="wheel-progress-indicator"
    class:bottom={position === "bottom"}
    class:post-refresh={wheelState.isShowingPostRefresh}
    style="visibility: {shouldBeVisible ? 'visible' : 'hidden'};"
>
    {#if wheelState.isShowingPostRefresh}
        ✓
    {:else if !wheelState.isCoolingDown}
        <!-- isCoolingDown の時も矢印とバーは表示しない -->
        {wheelState.direction === "up" ? "↑" : "↓"}
        <span class="progress-bar-wrapper">
            <div
                class="progress-bar"
                style="width: {Math.min(
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
        /* opacity と animation は visibility で制御する場合、初期はコメントアウトまたは削除 */
        /* opacity: 0; */
        /* animation: fade-in 0.2s ease-out forwards; */
        user-select: none;
        display: flex;
        align-items: center;
        gap: 0.5em;
        border: 1px solid var(--background-modifier-border);
    }

    /* visibility: hidden の要素はアニメーションさせても見えないため、
       アニメーションを適用する場合は、visibility: visible になった後に opacity を制御する必要があります。
       今回はシンプルな visibility 制御なので、アニメーションは一旦無視します。
       もしアニメーションも活かしたい場合は、別のロジックが必要になります。
    */
    .wheel-progress-indicator[style*="visibility: visible"] {
        opacity: 0.9; /* visible になったら不透明にする */
        animation: fade-in 0.2s ease-out forwards; /* アニメーションも適用 */
    }
    .wheel-progress-indicator[style*="visibility: hidden"] {
        opacity: 0;
        pointer-events: none; /* クリックイベントなどを無効にする */
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

    /* post-refreshの時はプログレスバーは不要なので非表示にするスタイルを追加 */
    .wheel-progress-indicator.post-refresh .progress-bar-wrapper {
        display: none;
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
