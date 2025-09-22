<script lang="ts">
    import type { SubjectItem } from "../../types";
    import { useSorter } from "../../stores/useSorter.svelte";
    import { type SorterState } from "../../stores/types";
    import ThreadTableHeader from "./ThreadTableHeader.svelte";
    import ThreadTableBody from "./ThreadTableBody.svelte";
    import LoadingSpinner from "../common/LoadingSpinner.svelte";
    import { useWheelRefresh } from "../../stores/useWheelRefresh.svelte";
    import WheelProgressIndicator from "../common/WheelProgressIndicator.svelte";

    type ThreadItem = SubjectItem & { index: number };

    type Props = {
        threads: SubjectItem[];
        visibleColumns: Record<string, boolean>;
        initialSortState: SorterState;
        isLoading: boolean;
        onSortChange: (newState: SorterState) => void;
        onRefresh: () => Promise<void>;
        openThread: (thread: ThreadItem, e: MouseEvent) => void;
        onContextMenu: (thread: ThreadItem, e: MouseEvent) => void;
        openHeaderContextMenu: (e: MouseEvent) => void;
    };

    let {
        threads,
        visibleColumns,
        initialSortState,
        isLoading,
        onSortChange,
        onRefresh,
        openThread,
        onContextMenu,
        openHeaderContextMenu,
    }: Props = $props();

    let tableContainerEl: HTMLDivElement | undefined = $state();

    const wheelRefresh = useWheelRefresh({
        getScrollElement: () => tableContainerEl,
        isEnabled: () => !isLoading, // ローディング中は無効化
        up: {
            onRefresh,
        },
    });

    // isRefreshing は wheelRefresh の内部状態に連動させる
    const isRefreshing = $derived(
        console.log(new Date().toISOString(), wheelRefresh.wheelState.status) ||
            wheelRefresh.wheelState.status === "refreshing"
    );

    // 外部からの isLoading と、ホイールリフレッシュ起因の isRefreshing の両方を考慮してローディング状態を決定する。
    // これにより、リフレッシュが開始された瞬間に確実かつ即座にローディング画面が表示される。
    const shouldShowLoading = $derived(isLoading || isRefreshing);

    // Helper function for ikioi calculation
    function calculateIkioi(thread: SubjectItem): number {
        const threadTime = parseInt(thread.id, 10);
        if (isNaN(threadTime)) return 0;
        const nowInSeconds = Date.now() / 1000;
        const elapsedTimeSeconds = nowInSeconds - threadTime;
        if (elapsedTimeSeconds <= 0) return 0;
        const elapsedTimeDays = elapsedTimeSeconds / (24 * 60 * 60);
        return thread.resCount / elapsedTimeDays;
    }

    // Derived state & sorting logic
    const indexedThreads = $derived(
        threads.map((t, index) => ({ ...t, index: index + 1 }))
    );

    const sorter = useSorter(
        () => indexedThreads,
        {
            index: { compare: (a, b) => a.index - b.index },
            title: { compare: (a, b) => a.title.localeCompare(b.title) },
            resCount: {
                compare: (a, b) => a.resCount - b.resCount,
                defaultDirection: "desc",
            },
            ikioi: {
                compare: (a, b) => calculateIkioi(a) - calculateIkioi(b),
                defaultDirection: "desc",
            },
        },
        initialSortState,
        onSortChange
    );
</script>

<div class="table-wrapper">
    <WheelProgressIndicator
        wheelState={wheelRefresh.wheelState}
        position="top"
    />

    {#if shouldShowLoading}
        <!--
          データがある場合（リフレッシュ時）は背景が透けるオーバーレイ(transparent)
          データがない場合（初回ロード時）は背景をしっかり覆うオーバーレイ
        -->
        <div
            class:loading-overlay={threads.length === 0}
            class:loading-overlay-transparent={threads.length > 0}
        >
            <LoadingSpinner size="large" />
        </div>
    {/if}

    <div class="thread-table" role="table">
        <ThreadTableHeader
            {visibleColumns}
            sortKey={sorter.sortKey}
            sortDirection={sorter.sortDirection}
            onSort={sorter.setSort}
            onContextMenu={openHeaderContextMenu}
        />

        <ThreadTableBody
            threads={sorter.sortedItems()}
            {visibleColumns}
            onThreadClick={openThread}
            {onContextMenu}
            bind:containerEl={tableContainerEl}
        />
    </div>
</div>

<style>
    .table-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        overflow: hidden;
    }

    .loading-overlay,
    .loading-overlay-transparent {
        position: absolute;
        inset: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
        backdrop-filter: blur(1px);
    }
    .loading-overlay {
        /* データがない時の初期ロード用 */
        background-color: var(--nobit-background-overlay);
    }
    .loading-overlay-transparent {
        /* データがある時のリフレッシュ用。
           背景が transparent だとオーバーレイの意味がないため修正。
           背景のテーブルがうっすら見えるようにする。 */
        background-color: var(--nobit-background-overlay);
        opacity: 0.8;
    }

    .thread-table {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        overflow: hidden;
    }
</style>
