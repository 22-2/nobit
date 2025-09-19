<script lang="ts">
    import type { SubjectItem } from "../../types";
    import { useSorter, type SorterState } from "../../stores/useSorter.svelte";
    import ThreadTableHeader from "./ThreadTableHeader.svelte";
    import ThreadTableBody from "./ThreadTableBody.svelte";

    type ThreadItem = SubjectItem & { index: number };

    type Props = {
        threads: SubjectItem[];
        visibleColumns: Record<string, boolean>;
        initialSortState: SorterState;
        onSortChange: (newState: SorterState) => void;
        openThread: (thread: ThreadItem, e: MouseEvent) => void;
        openContextMenu: (thread: ThreadItem, e: MouseEvent) => void;
        openHeaderContextMenu: (e: MouseEvent) => void;
        tableContainerEl?: HTMLDivElement;
    };

    let {
        threads,
        visibleColumns,
        initialSortState,
        onSortChange,
        openThread,
        tableContainerEl = $bindable(),
        openContextMenu,
        openHeaderContextMenu,
    }: Props = $props();

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
        {openContextMenu}
        bind:containerEl={tableContainerEl}
    />
</div>

<style>
    .thread-table {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        overflow: hidden;
    }
</style>
