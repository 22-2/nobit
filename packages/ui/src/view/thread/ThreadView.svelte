<!-- E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\view\thread\ThreadView.svelte -->
<script lang="ts">
    import type { ThreadFilters, PostData } from "../../types";
    import InlineWriteForm from "./InlineWriteForm.svelte";
    import PostItem from "./PostItem.svelte";
    import ThreadFiltersComponent from "./ThreadFilters.svelte";
    import LoadingSpinner from "../common/LoadingSpinner.svelte";
    import LoadingOverlay from "../common/LoadingOverlay.svelte";
    import ThreadToolbar from "./ThreadToolbar.svelte";
    import type { createThreadDataStore } from "../../stores/threadDataStore.svelte.ts";
    import { useWheelRefresh } from "../../stores/useWheelRefresh.svelte";
    import WheelProgressIndicator from "../common/WheelProgressIndicator.svelte";

    type Props = {
        store: ReturnType<typeof createThreadDataStore>;
    };
    let { store }: Props = $props();

    // フォームの表示状態やフィルタはViewのローカルな状態として管理
    let isWriteFormVisible = $state(false);
    let filters: ThreadFilters = $state({
        searchText: "",
        image: false,
        video: false,
        external: false,
        internal: false,
        popular: false,
    });
    let postsListEl: HTMLDivElement | undefined = $state();

    const wheelRefresh = useWheelRefresh({
        getScrollElement: () => postsListEl,
        isEnabled: () =>
            !store.viewState.isLoading && !store.viewState.isSubmitting,
        down: {
            onRefresh: store.loadThread,
        },
    });

    // use:action for binding trigger line
    const bindTriggerLineAction = (node: HTMLElement) => {
        wheelRefresh.bindRefreshTriggerLine(node);
    };

    const filteredPosts = $derived(() => {
        if (!store.thread?.posts) return [];
        return store.thread.posts.filter((post) => {
            if (!post) return false;
            const searchText = filters.searchText.toLowerCase().trim();
            if (
                searchText &&
                !post.content.toLowerCase().includes(searchText)
            ) {
                return false;
            }
            if (
                filters.image &&
                (!post.imageUrls || post.imageUrls.length === 0)
            ) {
                return false;
            }
            return true;
        });
    });

    async function handlePost(postData: PostData) {
        const result = await store.postMessage(postData);
        if (result.success) {
            isWriteFormVisible = false; // 成功時のみフォームを閉じる
        }
    }
</script>

<div class="thread-view">
    <ThreadFiltersComponent bind:filters isVisible={true} />

    <div class="content-wrapper">
        <!-- 更新中のローディングオーバーレイ -->
        {#if store.viewState.isLoading && store.thread}
            <LoadingOverlay transparent={true} />
        {/if}

        <!-- メインコンテンツ -->
        {#if !store.thread}
            {#if store.viewState.isLoading}
                <!-- 初回ロード中 -->
                <div class="indicator-container">
                    <LoadingSpinner />
                </div>
            {:else if store.viewState.error}
                <!-- エラー表示 -->
                <div class="indicator-container error-indicator">
                    <p>エラー: {store.viewState.error}</p>
                    <button class="mod-cta" onclick={() => store.loadThread()}>
                        リトライ
                    </button>
                </div>
            {/if}
        {:else}
            <!-- スレッドコンテンツ表示 -->
            <div class="posts-list" role="feed" bind:this={postsListEl}>
                {#each filteredPosts() as post (post.resNum)}
                    <PostItem {post} index={post.resNum - 1} />
                {/each}
                <div class="refresh-trigger-line" use:bindTriggerLineAction />
            </div>
        {/if}
    </div>

    <!-- 投稿フォームまたはツールバー -->
    {#if isWriteFormVisible}
        <InlineWriteForm
            {handlePost}
            onCancel={() => (isWriteFormVisible = false)}
            isSubmitting={store.viewState.isSubmitting}
        />
    {:else}
        <ThreadToolbar
            onRefresh={() => store.loadThread()}
            onWriteButtonClick={() => (isWriteFormVisible = true)}
        />
    {/if}

    <WheelProgressIndicator
        wheelState={wheelRefresh.wheelState}
        position="bottom"
    />
</div>

<style>
    .thread-view {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden; /* 親コンテナでスクロールを制御 */
    }
    .content-wrapper {
        position: relative; /* オーバーレイの基準点 */
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow-y: hidden; /* スクロールはposts-listで行う */
    }
    .posts-list {
        flex: 1;
        overflow-y: auto; /* 投稿リスト部分をスクロール可能にする */
    }
    .indicator-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 1em;
        padding: 1em;
        text-align: center;
    }
    .error-indicator p {
        color: var(--text-error);
    }
    .refresh-trigger-line {
        height: 1px; /* 視覚的には見えないが、レイアウト上の位置を持つ */
    }
</style>
