<script lang="ts">
    import type { SubjectItem } from "../../types";

    type ThreadItem = SubjectItem & { index: number };

    type Props = {
        thread: ThreadItem;
        visibleColumns: Record<string, boolean>;
        onMouseDown: (thread: ThreadItem, e: MouseEvent) => void;
        onContextMenu: (thread: ThreadItem, e: MouseEvent) => void;
    };

    let { thread, visibleColumns, onMouseDown, onContextMenu }: Props =
        $props();

    function calculateIkioi(thread: SubjectItem): number {
        const threadTime = parseInt(thread.id, 10);
        if (isNaN(threadTime)) return 0;
        const nowInSeconds = Date.now() / 1000;
        const elapsedTimeSeconds = nowInSeconds - threadTime;
        if (elapsedTimeSeconds <= 0) return 0;
        const elapsedTimeDays = elapsedTimeSeconds / (24 * 60 * 60);
        return thread.resCount / elapsedTimeDays;
    }
</script>

<div
    class="tr"
    role="row"
    data-testid="thread-row-{thread.id}"
    onmousedown={(e) => onMouseDown(thread, e)}
    oncontextmenu={(e) => {
        e.preventDefault();
        onContextMenu(thread, e);
    }}
>
    {#if visibleColumns.index}
        <div class="td col-index" role="cell">
            {thread.index}
        </div>
    {/if}
    {#if visibleColumns.title}
        <div class="td col-title" role="cell" title={thread.title}>
            <div class="title-cell-content">
                {thread.title}
            </div>
        </div>
    {/if}
    {#if visibleColumns.resCount}
        <div class="td col-res" role="cell">
            {thread.resCount}
        </div>
    {/if}
    {#if visibleColumns.ikioi}
        <div class="td col-ikioi" role="cell">
            {calculateIkioi(thread).toFixed(2)}
        </div>
    {/if}
</div>

<style>
    @import "./thread-table-styles.css";

    .tr {
        display: flex;
        align-items: center;
        width: 100%;
        border-bottom: var(--border-width) solid
            var(--background-modifier-border);
        min-height: var(--size-4-9); /* 36px - 推定行高 */
    }

    .tr:hover {
        background-color: var(
            --my-item-background-hover,
            var(--background-secondary-alt)
        );
        color: var(--my-item-color-hover, var(--text-normal));
        cursor: pointer;
    }

    .td {
        padding: var(--size-4-2); /* 8px */
        text-align: left;
        white-space: nowrap;
        box-sizing: border-box;
        font-size: var(--font-ui-small); /* 13px */
    }

    .title-cell-content {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>
