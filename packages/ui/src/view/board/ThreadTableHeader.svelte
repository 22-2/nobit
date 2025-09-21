<script lang="ts">
    import type { SorterState } from "../../services/types";
    import type { ColumnKey } from "../../types";

    type Props = {
        visibleColumns: Record<string, boolean>;
        sortKey: ColumnKey | null;
        sortDirection: "asc" | "desc";
        onSort: (key: string) => void;
        onContextMenu: (e: MouseEvent) => void;
    };

    let {
        visibleColumns,
        sortKey,
        sortDirection,
        onSort,
        onContextMenu,
    }: Props = $props();

    const headers = [
        { key: "index", label: "#", className: "col-index" },
        { key: "title", label: "タイトル", className: "col-title" },
        { key: "resCount", label: "レス", className: "col-res" },
        { key: "ikioi", label: "勢い", className: "col-ikioi" },
    ] as const;
</script>

<div
    class="thread-table-header"
    role="rowheader"
    oncontextmenu={(e) => {
        e.preventDefault();
        onContextMenu(e);
    }}
>
    {#each headers as header (header.key)}
        {#if visibleColumns[header.key]}
            <div
                class="th {header.className}"
                role="columnheader"
                onclick={() => onSort(header.key)}
                class:sorted={sortKey === header.key}
            >
                {#if sortKey === header.key}
                    <span class="sort-indicator">
                        {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                {/if}
                {header.label}
            </div>
        {/if}
    {/each}
</div>

<style>
    @import "./thread-table-styles.css";

    .thread-table-header {
        flex-shrink: 0;
        cursor: context-menu;
        border-bottom: var(--border-width) solid
            var(--background-modifier-border);
        background-color: var(--background-secondary);
        z-index: var(--layer-sidedock); /* 10 */
        position: sticky;
        top: 0;
        display: flex;
        align-items: center;
        width: 100%;
    }

    .th {
        padding: var(--size-4-2); /* 8px */
        text-align: left;
        white-space: nowrap;
        box-sizing: border-box;
        font-size: var(--font-ui-small); /* 13px */
        cursor: pointer;
        user-select: none;
        font-weight: var(--font-semibold); /* 600 */
    }

    .sort-indicator {
        font-size: var(--font-ui-smaller); /* 12px */
        margin-left: var(--size-4-1); /* 4px */
    }

    .th:hover {
        background-color: var(
            --my-item-background-hover,
            var(--background-modifier-hover)
        );
        color: var(--my-item-color-hover, var(--text-normal));
    }

    .th.sorted {
        color: var(--text-accent);
    }
</style>
