<!-- src/stories/helpers/WheelRefreshTester.svelte -->
<script lang="ts">
    import { useWheelRefresh } from "../../stores/useWheelRefresh.svelte";
    import WheelProgressIndicator from "../../view/common/WheelProgressIndicator.svelte";

    let {
        isEnabled = true,
        onUpRefresh,
        onDownRefresh,
        upThreshold = 7,
        downThreshold = 7,
        initialScrollTop = 0,
        // デフォルトは 'top'
        statePosition = "top",
    } = $props<{
        isEnabled?: boolean;
        onUpRefresh?: () => Promise<void>;
        onDownRefresh?: () => Promise<void>;
        upThreshold?: number;
        downThreshold?: number;
        initialScrollTop?: number;
        // 状態表示の位置を指定するプロパティを追加
        statePosition?: "top" | "bottom";
    }>();

    let scrollContainerEl: HTMLElement | undefined = $state();
    let isRefreshing = $state(false);

    const createRefreshHandler = (
        callback?: () => Promise<void>,
        isUp: boolean = true
    ) => {
        if (!callback) return undefined;

        return {
            onRefresh: async () => {
                isRefreshing = true;
                await callback();
                setTimeout(() => {
                    isRefreshing = false;
                }, 1000);
            },
            threshold: isUp ? upThreshold : downThreshold,
        };
    };

    // useWheelRefresh から wheelState と bindRefreshTriggerLine を取得
    const { wheelState, bindRefreshTriggerLine } = useWheelRefresh({
        getScrollElement: () => scrollContainerEl,
        isEnabled: () => isEnabled && !isRefreshing,
        up: createRefreshHandler(onUpRefresh, true),
        down: createRefreshHandler(onDownRefresh, false),
    });

    $effect(() => {
        if (scrollContainerEl) {
            scrollContainerEl.scrollTop =
                initialScrollTop === -1
                    ? scrollContainerEl.scrollHeight
                    : initialScrollTop;
        }
    });
</script>

<div
    class="test-container"
    data-testid="scroll-container"
    bind:this={scrollContainerEl}
>
    <div class="content">
        <!-- 有効なリフレッシュ方向に応じてインジケータを条件付きで表示 -->
        {#if onUpRefresh}
            <WheelProgressIndicator {wheelState} position="top" />
        {/if}
        {#if onDownRefresh}
            <WheelProgressIndicator {wheelState} position="bottom" />
        {/if}
        <!-- statePositionに応じて状態表示の位置を切り替え -->
        {#if statePosition === "top"}
            <div class="indicator">
                <h3>Current State</h3>
                <p data-testid="state-direction">
                    Direction: {wheelState.direction ?? "none"}
                </p>
                <p data-testid="state-count">Count: {wheelState.count}</p>
                <p data-testid="state-cooldown">
                    isCoolingDown: {wheelState.isCoolingDown}
                </p>
                <p data-testid="state-refreshing">
                    isRefreshing: {isRefreshing}
                </p>
                <p data-testid="state-post-refresh">
                    isShowingPostRefresh: {wheelState.isShowingPostRefresh}
                </p>
            </div>
        {/if}

        <p>Scroll up at the top to trigger refresh.</p>
        <p class="filler">Content</p>
        <p class="filler">Content</p>
        <p class="filler">Content</p>
        <p class="filler">Content</p>
        <p class="filler">Content</p>
        <p class="filler">Content</p>
        <p class="filler">Content</p>
        <p class="filler">Content</p>
        <p class="filler">Content</p>
        <p>Scroll down at the bottom to trigger refresh.</p>

        {#if statePosition === "bottom"}
            <div class="indicator">
                <h3>Current State</h3>
                <p data-testid="state-direction">
                    Direction: {wheelState.direction ?? "none"}
                </p>
                <p data-testid="state-count">Count: {wheelState.count}</p>
                <p data-testid="state-cooldown">
                    isCoolingDown: {wheelState.isCoolingDown}
                </p>
                <p data-testid="state-refreshing">
                    isRefreshing: {isRefreshing}
                </p>
                <p data-testid="state-post-refresh">
                    isShowingPostRefresh: {wheelState.isShowingPostRefresh}
                </p>
            </div>
        {/if}
    </div>
</div>

<style>
    .test-container {
        height: var(--size-4-75); /* 300px */
        width: var(--size-4-100); /* 400px */
        overflow-y: auto;
        border: var(--border-width-thick, 2px) solid var(--interactive-accent);
        background-color: var(--background-primary);
        font-family: var(--font-interface-theme);
        font-size: var(--font-ui-small); /* 13px */
    }
    .content {
        padding: var(--size-4-4); /* 16px */
        position: relative;
        color: var(--text-normal);
    }
    .indicator {
        border: var(--border-width) solid var(--background-modifier-border);
        padding: var(--size-4-2); /* 8px */
        margin: var(--size-4-4) 0; /* 16px 0 */
        background-color: var(--background-secondary);
        border-radius: var(--radius-m);
    }
    .filler {
        padding: var(--size-4-4) 0; /* 16px 0 */
    }
</style>
