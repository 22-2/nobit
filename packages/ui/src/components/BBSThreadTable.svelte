<script lang="ts">
    // import { setTooltip, type TooltipOptions } from "obsidian"; // obsidianを除外
    import type { SubjectItem } from "../types";
    import { createSorter, type SorterState } from "../stores/useSorter.svelte";
    // import { createVirtualizer } from "../utils/virtualizer.svelte"; // virtualizerを除外

    type ThreadItem = SubjectItem & { index: number };

    type Props = {
        threads: SubjectItem[];
        visibleColumns: Record<string, boolean>;
        initialSortState: SorterState;
        onSortChange: (newState: SorterState) => void;
        // useVirtualScroll: boolean; // virtualizerを除外したので不要
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
        // useVirtualScroll, // virtualizerを除外したので不要
        openThread,
        tableContainerEl = $bindable(),
        openContextMenu,
        openHeaderContextMenu,
    }: Props = $props();

    // ホイールリフレッシュ用に、この要素への参照は必要
    // 親コンポーネントに公開するために `export` (Svelte 4以前) または `let` と `bind:this` (Svelte 5 runestone)
    // Svelte 5の$propsを使っているので、`bind:this`で外部から参照を受け取る形に修正
    // let tableContainerEl: HTMLDivElement | undefined = $state();
    // export { tableContainerEl as tableBodyRef }; // 親コンポーネントが `bind:tableBodyRef` でアクセスできるように公開

    // --- ツールチップアクション ---
    // obsidianのsetTooltipの代わりに、標準のtitle属性を使用
    // Svelteではactionは不要になり、直接title属性を書けば良い
    // function tooltipAction(node: HTMLElement, text: string) {
    // 	const options: TooltipOptions = { delay: 1 };
    // 	setTooltip(node, text, options);
    // 	return { update(newText: string) { setTooltip(node, newText, options); }, };
    // }

    // --- Helper Function ---
    function calculateIkioi(thread: SubjectItem): number {
        const threadTime = parseInt(thread.id, 10);
        if (isNaN(threadTime)) return 0;
        const nowInSeconds = Date.now() / 1000;
        const elapsedTimeSeconds = nowInSeconds - threadTime;
        if (elapsedTimeSeconds <= 0) return 0;
        const elapsedTimeDays = elapsedTimeSeconds / (24 * 60 * 60);
        return thread.resCount / elapsedTimeDays;
    }

    // --- Derived State & Sorting Logic ---
    const indexedThreads = $derived(
        threads.map((t, index) => ({ ...t, index: index + 1 }))
    );

    const sorter = createSorter(
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

    // --- 仮想リストのセットアップ ---
    // createVirtualizerを除外したので、仮想リストのロジックは削除
    // const rowVirtualizer = $derived(
    // 	createVirtualizer({
    // 		count: sorter.sortedItems().length,
    // 		getScrollElement: () => tableContainerEl!,
    // 		estimateSize: () => 36, // 1行の推定高 (padding 8*2 + font-size)
    // 		overscan: 10,
    // 	}),
    // );
    // const virtualItems = $derived(rowVirtualizer.getVirtualItems());

    // --- UI Configuration ---
    const headers = [
        { key: "index", label: "#", className: "col-index" },
        { key: "title", label: "タイトル", className: "col-title" },
        { key: "resCount", label: "レス", className: "col-res" },
        { key: "ikioi", label: "勢い", className: "col-ikioi" },
    ] as const;
</script>

<div class="thread-table" role="table">
    <!-- ヘッダー -->
    <div
        class="thread-table-header"
        role="rowheader"
        oncontextmenu={(e) => {
            e.preventDefault();
            openHeaderContextMenu(e);
        }}
    >
        {#each headers as header (header.key)}
            {#if visibleColumns[header.key]}
                <div
                    class="th {header.className}"
                    role="columnheader"
                    onclick={() => sorter.setSort(header.key)}
                    class:sorted={sorter.sortKey === header.key}
                >
                    {#if sorter.sortKey === header.key}
                        <span class="sort-indicator">
                            {sorter.sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                    {/if}
                    {header.label}
                </div>
            {/if}
        {/each}
    </div>

    <!-- ボディ（通常リストのみ） -->
    <div class="thread-table-body" bind:this={tableContainerEl} role="rowgroup">
        <!-- 仮想スクロールのロジックを削除し、常に通常リストで表示 -->
        {#each sorter.sortedItems() as thread (thread.id)}
            <div
                class="tr"
                role="row"
                data-testid="thread-row-{thread.id}"
                onmousedown={(e) => openThread(thread, e)}
                oncontextmenu={(e) => {
                    e.preventDefault();
                    openContextMenu(thread, e);
                }}
            >
                {#if visibleColumns.index}
                    <div class="td col-index" role="cell">
                        {thread.index}
                    </div>
                {/if}
                {#if visibleColumns.title}
                    <div class="td col-title" role="cell" title={thread.title}>
                        <!--
                        setTooltipの代わりに標準のtitle属性を使用
                        -->
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
        {/each}
    </div>
</div>

<style>
    .thread-table {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        overflow: hidden; /* コンテナ全体がスクロールしないように */
    }

    .thread-table-header {
        flex-shrink: 0;
        cursor: context-menu;
        border-bottom: var(--border-width) solid
            var(--background-modifier-border);
        background-color: var(--background-secondary);
        z-index: var(--layer-sidedock); /* 10 */
        position: sticky;
        top: 0;
    }

    .thread-table-body {
        flex-grow: 1;
        overflow-y: auto;
        position: relative; /* 仮想リストのコンテナ用 (名残だが、なくても問題ない) */
    }

    /* --- 行のレイアウト (Flexbox) --- */
    .thread-table-header,
    .tr {
        display: flex;
        align-items: center;
        width: 100%;
    }

    .tr {
        border-bottom: var(--border-width) solid
            var(--background-modifier-border);
        min-height: var(--size-4-9); /* 36px - 推定行高 */
    }

    /* --- セル共通スタイル（Obsidianの4pxグリッド準拠） --- */
    .th,
    .td {
        padding: var(--size-4-2); /* 8px */
        text-align: left;
        white-space: nowrap;
        box-sizing: border-box;
        font-size: var(--font-ui-small); /* 13px */
    }

    .th {
        cursor: pointer;
        user-select: none;
        font-weight: var(--font-semibold); /* 600 */
        font-size: var(--font-ui-small); /* 13px */
    }
    .sort-indicator {
        font-size: var(--font-ui-smaller); /* 12px */
        margin-left: var(--size-4-1); /* 4px */
    }

    /* --- ホバースタイル --- */
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
    .tr:hover {
        background-color: var(
            --my-item-background-hover,
            var(--background-secondary-alt)
        );
        color: var(--my-item-color-hover, var(--text-normal));
        cursor: pointer;
    }

    /* --- 列の幅と配置（Obsidianスペーシング準拠） --- */
    .col-index {
        flex: 0 0 var(--size-4-16); /* 64px */
        text-align: right;
        justify-content: flex-end;
        padding-right: var(--size-4-4); /* 16px */
    }
    .col-title {
        flex: 1 1 0;
        min-width: 0;
    }
    .col-res {
        flex: 0 0 var(--size-4-18); /* 72px */
        text-align: right;
        justify-content: flex-end;
    }
    .col-ikioi {
        flex: 0 0 var(--size-4-18); /* 72px */
        text-align: right;
        justify-content: flex-end;
    }

    /* --- タイトルセルのスタイル --- */
    .title-cell-content {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap; /* これも重要 */
    }
</style>
