<!-- src/components/ThreadToolbar.svelte -->
<script lang="ts">
    // Tabler Icons
    import { RefreshCw, Pencil } from "@lucide/svelte";

    let { isCoolingDown, isLoading, onRefresh, onWriteButtonClick } = $props<{
        isCoolingDown?: boolean;
        isLoading?: boolean;
        onRefresh?: () => void;
        onWriteButtonClick?: () => void;
    }>();
</script>

<div class="thread-footer-toolbar">
    {#if onRefresh}
        <button
            class="clickable-icon"
            aria-label="スレッドを更新"
            onclick={onRefresh}
            disabled={isCoolingDown || isLoading}
        >
            <RefreshCw size={16} />
        </button>
    {/if}

    {#if onWriteButtonClick}
        <button
            class="clickable-icon"
            aria-label="このスレッドに書き込む"
            onclick={onWriteButtonClick}
        >
            <Pencil size={16} />
        </button>
    {/if}
</div>

<style>
    /* --- ▼ フッターツールバーのスタイル ▼ --- */
    .thread-footer-toolbar {
        flex-shrink: 0;
        display: flex;
        justify-content: flex-end;
        align-items: center; /* アイコンを中央揃えに */
        gap: 0.5em;
        padding: 0.5em 1em;
        border-top: 1px solid var(--background-modifier-border);
        background-color: var(--background-primary);
    }

    .thread-footer-toolbar .clickable-icon {
        color: var(--icon-color);
    }
    .thread-footer-toolbar .clickable-icon:hover {
        color: var(--icon-color-hover);
    }
    .thread-footer-toolbar .clickable-icon.is-active {
        color: var(--icon-color-active);
    }
</style>
