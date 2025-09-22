<script lang="ts">
    import type { SubjectItem } from "../../types";
    import ThreadTableRow from "./ThreadTableRow.svelte";

    type ThreadItem = SubjectItem & { index: number };

    type Props = {
        threads: ThreadItem[];
        visibleColumns: Record<string, boolean>;
        onThreadClick: (thread: ThreadItem, e: MouseEvent) => void;
        onContextMenu: (thread: ThreadItem, e: MouseEvent) => void;
        containerEl?: HTMLDivElement;
    };

    let {
        threads,
        visibleColumns,
        onThreadClick,
        onContextMenu,
        containerEl = $bindable(),
    }: Props = $props();

    function handleMouseDown(thread: ThreadItem, e: MouseEvent) {
        if (e.button === 2) {
            onContextMenu(thread, e);
        } else if (e.button === 0 || e.button === 1) {
            onThreadClick(thread, e);
        }
    }
</script>

<div class="thread-table-body" bind:this={containerEl} role="rowgroup">
    {#each threads as thread (thread.id)}
        <ThreadTableRow
            {thread}
            {visibleColumns}
            onMouseDown={handleMouseDown}
        />
    {/each}
</div>

<style>
    .thread-table-body {
        flex-grow: 1;
        overflow-y: auto;
        position: relative;
    }
</style>
