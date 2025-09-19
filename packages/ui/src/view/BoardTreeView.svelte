<script lang="ts">
    import type { BBSMenu } from "../types";
    import TreeItem from "../components/TreeItem.svelte";
    import TreeContainer from "../components/TreeContainer.svelte";
    import LoadingMessage from "../components/LoadingMessage.svelte";

    let { getBBSMenus, openBoardView } = $props<{
        getBBSMenus: () => Promise<{ url: string; menu: BBSMenu }[]>;
        openBoardView: (boardUrl: string) => void;
    }>();

    let menus = $state<{ url: string; menu: BBSMenu }[]>([]);
    let isLoading = $state(true);
    let error = $state("");

    // サーバーごと、カテゴリごとの開閉状態を単一のオブジェクトで管理
    let openState = $state<Record<string, boolean>>({});

    function toggle(key: string) {
        openState[key] = !openState[key];
    }

    (async () => {
        try {
            menus = await getBBSMenus();
            // デフォルトで最初のBBS Menuソースを開いておく
            if (menus.length > 0 && menus[0]) {
                openState[menus[0].url] = true;
            }
        } catch (e) {
            error = e instanceof Error ? e.message : "Failed to load BBS Menus";
        } finally {
            isLoading = false;
        }
    })();
</script>

<div class="nav-files-container board-list-tree-container">
    {#if isLoading}
        <LoadingMessage message="読み込み中..." />
    {:else if error}
        <LoadingMessage message={error} isError={true} />
    {:else}
        {#each menus as { url, menu } (url)}
            <TreeItem isOpen={openState[url]} onclick={() => toggle(url)}>
                {new URL(url).hostname}
            </TreeItem>

            {#if openState[url]}
                <TreeContainer>
                    {#each menu as category (category.name)}
                        {@const categoryKey = `${url}#${category.name}`}
                        <TreeItem
                            isOpen={openState[categoryKey]}
                            onclick={() => toggle(categoryKey)}
                        >
                            {category.name}
                        </TreeItem>

                        {#if openState[categoryKey]}
                            <TreeContainer>
                                {#each category.boards as board (board.url)}
                                    <TreeItem
                                        icon={false}
                                        onclick={() => openBoardView(board.url)}
                                    >
                                        {board.name}
                                    </TreeItem>
                                {/each}
                            </TreeContainer>
                        {/if}
                    {/each}
                </TreeContainer>
            {/if}
        {/each}
    {/if}
</div>

<style>
    .board-list-tree-container {
        height: 100%;
        overflow-y: auto;
        padding: var(--size-4-2);
    }
</style>
