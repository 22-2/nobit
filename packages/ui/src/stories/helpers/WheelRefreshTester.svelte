<!-- src/stories/helpers/WheelRefreshTester.svelte -->
<script lang="ts">
  import { useWheelRefresh } from '../../stores/useWheelRefresh.svelte';
  import WheelProgressIndicator from '../../components/WheelProgressIndicator.svelte';

  type Props = {
    isEnabled?: boolean;
    onUpRefresh?: () => Promise<void>;
    onDownRefresh?: () => Promise<void>;
    upThreshold?: number;
    downThreshold?: number;
    initialScrollTop?: number;
    // 状態表示の位置を指定するプロパティを追加
    statePosition?: 'top' | 'bottom';
  };

  let {
    isEnabled = true,
    onUpRefresh,
    onDownRefresh,
    upThreshold = 7,
    downThreshold = 7,
    initialScrollTop = 0,
    // デフォルトは 'top'
    statePosition = 'top',
  } = $props<Props>();

  let scrollContainerEl: HTMLElement | undefined = $state();
  let isRefreshing = $state(false);

  const createRefreshHandler = (callback?: () => Promise<void>) => {
    if (!callback) return undefined;

    return {
        onRefresh: async () => {
            isRefreshing = true;
            await callback();
            setTimeout(() => {
                isRefreshing = false;
            }, 1000);
        },
        threshold: onUpRefresh === callback ? upThreshold : downThreshold,
    }
  };

  const { wheelProgress, isCoolingDown } = useWheelRefresh({
    getScrollElement: () => scrollContainerEl,
    isEnabled: () => isEnabled && !isRefreshing,
    up: createRefreshHandler(onUpRefresh),
    down: createRefreshHandler(onDownRefresh),
  });

  $effect(() => {
      if (scrollContainerEl) {
          scrollContainerEl.scrollTop = initialScrollTop === -1
            ? scrollContainerEl.scrollHeight
            : initialScrollTop;
      }
  });

  // 状態表示用のHTMLブロックをコンポーネントとして定義
  const StateIndicator = ({ wheelProgress, isCoolingDown, isRefreshing }) => {
    return `
      <div class="indicator">
          <h3>Current State</h3>
          <p data-testid="state-direction">Direction: ${wheelProgress.direction ?? 'none'}</p>
          <p data-testid="state-count">Count: ${wheelProgress.count}</p>
          <p data-testid="state-cooldown">isCoolingDown: ${isCoolingDown}</p>
          <p data-testid="state-refreshing">isRefreshing: ${isRefreshing}</p>
      </div>
    `;
  };
</script>

<div class="test-container" data-testid="scroll-container" bind:this={scrollContainerEl}>
    <WheelProgressIndicator
        progress={wheelProgress}
        {isCoolingDown}
        isRefreshing={isRefreshing}
        position="top"
    />
    <WheelProgressIndicator
        progress={wheelProgress}
        {isCoolingDown}
        isRefreshing={isRefreshing}
        position="bottom"
    />

    <div class="content">
        <!-- statePositionに応じて状態表示の位置を切り替え -->
        {#if statePosition === 'top'}
            <div class="indicator">
                <h3>Current State</h3>
                <p data-testid="state-direction">Direction: {wheelProgress.direction ?? 'none'}</p>
                <p data-testid="state-count">Count: {wheelProgress.count}</p>
                <p data-testid="state-cooldown">isCoolingDown: {isCoolingDown}</p>
                <p data-testid="state-refreshing">isRefreshing: {isRefreshing}</p>
            </div>
        {/if}

        <p>Scroll up at the top to trigger refresh.</p>
        <p class="filler">Content</p><p class="filler">Content</p><p class="filler">Content</p>
        <p class="filler">Content</p><p class="filler">Content</p><p class="filler">Content</p>
        <p class="filler">Content</p><p class="filler">Content</p><p class="filler">Content</p>
        <p>Scroll down at the bottom to trigger refresh.</p>

        {#if statePosition === 'bottom'}
            <div class="indicator">
                <h3>Current State</h3>
                <p data-testid="state-direction">Direction: {wheelProgress.direction ?? 'none'}</p>
                <p data-testid="state-count">Count: {wheelProgress.count}</p>
                <p data-testid="state-cooldown">isCoolingDown: {isCoolingDown}</p>
                <p data-testid="state-refreshing">isRefreshing: {isRefreshing}</p>
            </div>
        {/if}
    </div>
</div>

<style>
    .test-container {
        position: relative;
        height: 300px;
        width: 400px;
        overflow-y: auto;
        border: 2px solid #3366ff;
        background-color: #f0f4f8;
        font-family: sans-serif;
    }
    .content {
        padding: 1rem;
        height: 600px;
    }
    .indicator {
        border: 1px solid #ccc;
        padding: 0.5rem;
        margin: 1rem 0;
        background-color: white;
        border-radius: 8px;
    }
    .filler {
      padding: 1rem 0;
    }
</style>
