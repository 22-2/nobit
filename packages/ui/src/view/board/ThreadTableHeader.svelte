<script lang="ts">
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

    function handleKeyDown(e: KeyboardEvent, key: string) {
        if (e.key === "Enter" || e.key === " ") {
            onSort(key);
        }
    }
</script>

<div
    class="thread-table-header"
    role="rowheader"
    tabindex="0"
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
                tabindex="0"
                onclick={() => onSort(header.key)}
                onkeydown={(e) => handleKeyDown(e, header.key)}
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
        border-bottom: var(--nobit-border-width) solid
            var(--nobit-background-modifier-border);
        background-color: var(--nobit-background-secondary);
        z-index: var(--nobit-layer-sidedock);
        position: sticky;
        top: 0;
        display: flex;
        align-items: center;
        width: 100%;
    }

    .th {
        padding: var(--nobit-size-4-2);
        text-align: left;
        white-space: nowrap;
        box-sizing: border-box;
        font-size: var(--nobit-font-ui-small);
        cursor: pointer;
        user-select: none;
        font-weight: var(--nobit-font-semibold);
    }

    .sort-indicator {
        font-size: var(--nobit-font-ui-smaller);
        margin-left: var(--nobit-size-4-1);
    }

    .th:hover {
        background-color: var(
            --nobit-my-item-background-hover,
            var(--nobit-background-modifier-hover)
        );
        color: var(--nobit-my-item-color-hover, var(--nobit-text-normal));
    }

    .th.sorted {
        color: var(--nobit-text-accent);
    }
</style>
