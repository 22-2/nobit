<!-- src/components/ThreadFilters.svelte -->
<script lang="ts">
    import type { ThreadFilters } from "../../types";

    import { Heart, Image, Video, Search } from "lucide-svelte";

    let {
        filters = $bindable({
            popular: false,
            image: false,
            video: false,
            external: false,
            internal: false,
            searchText: "",
        }),
        isVisible = true,
    } = $props<{
        filters: ThreadFilters;
        isVisible: boolean;
    }>();

    const filterButtons = [
        {
            key: "popular",
            label: "人気",
            icon: Heart,
            ariaLabel: "人気レスで絞り込む",
        },
        {
            key: "image",
            label: "画像",
            icon: Image,
            ariaLabel: "画像を含むレスで絞り込む",
        },
        {
            key: "video",
            label: "動画",
            icon: Video,
            ariaLabel: "動画を含むレスで絞り込む",
        },
        {
            key: "external",
            label: "外部",
            icon: undefined,
            ariaLabel: "外部リンクを含むレスで絞り込む",
        },
        {
            key: "internal",
            label: "内部",
            icon: undefined,
            ariaLabel: "スレ内アンカーを含むレスで絞り込む",
        },
    ] as const;

    function toggleFilter(key: keyof Omit<ThreadFilters, "searchText">) {
        // Svelte 5: To ensure reactivity with parent components,
        // we must create a new object rather than mutating the existing one.
        filters = { ...filters, [key]: !filters[key] };
    }

    function onSearchInput(event: Event) {
        const target = event.target as HTMLInputElement;
        filters = { ...filters, searchText: target.value };
    }
</script>

{#if isVisible}
    <div class="thread-filters">
        <div class="filter-buttons-group">
            {#each filterButtons as btn}
                {@const IconComponent = btn.icon}
                <button
                    class="filter-button"
                    class:active={filters[btn.key]}
                    onclick={() =>
                        toggleFilter(
                            btn.key as keyof Omit<ThreadFilters, "searchText">
                        )}
                    aria-label={btn.ariaLabel}
                    title={btn.ariaLabel}
                >
                    {#if IconComponent}
                        <IconComponent size={18} />
                    {:else}
                        {btn.label}
                    {/if}
                </button>
            {/each}
        </div>

        <div class="search-input-wrapper">
            <Search size={16} class="search-icon" />
            <input
                type="text"
                value={filters.searchText}
                oninput={onSearchInput}
                placeholder="検索..."
                class="search-input"
            />
        </div>
    </div>
{/if}

<style>
    .thread-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;

        position: sticky;
        /* The parent .thread-content-area has padding-top, so we need to pull it up */
        top: -1px;
        z-index: 10;
        background-color: var(--background-primary);
        /* The container has horizontal padding, so we only need vertical */
        padding: 0.75em 0;
        margin-bottom: 1em;
        /* Add a subtle border to separate from content */
        border-bottom: 1px solid var(--background-modifier-border);
    }

    .filter-buttons-group {
        display: flex;
        flex-wrap: nowrap; /* ボタンは折り返さない */
        gap: 4px;
        align-items: center;
    }

    .filter-button {
        background-color: transparent;
        border: none;
        color: var(--text-muted);
        border-radius: var(--radius-s);
        cursor: pointer;
        transition:
            color 0.2s ease,
            background-color 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px;
        font-size: 0.9em;
    }

    .filter-button:not(:has(svg)) {
        padding: 4px 8px;
    }

    .filter-button:hover {
        background-color: var(--background-modifier-hover);
        color: var(--text-normal);
    }
    .filter-button.active {
        color: var(--interactive-accent);
        font-weight: 600;
    }

    .filter-button :global(svg) {
        stroke-width: 2;
    }
    .filter-button.active :global(svg) {
        stroke-width: 2.5;
    }

    /* --- ▼ 検索入力エリアのスタイル ▼ --- */
    .search-input-wrapper {
        display: flex;
        align-items: center;
        background-color: var(--background-secondary);
        border-radius: var(--radius-m);
        padding: 0 8px;
        flex-grow: 1;
        min-width: 150px; /* 最小幅 */
    }
    .search-input-wrapper:focus-within {
        box-shadow: 0 0 0 1px var(--interactive-accent);
    }

    .search-icon {
        color: var(--text-faint);
        margin-right: 6px;
    }

    .search-input {
        width: 100%;
        border: none;
        background-color: transparent;
        padding: 6px 0;
        color: var(--text-normal);
        font-size: 0.9em;
    }
    .search-input:focus {
        outline: none;
        box-shadow: none;
    }
</style>
