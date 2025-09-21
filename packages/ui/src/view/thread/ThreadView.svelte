<!-- src/view/thread/ThreadView.svelte -->
<script lang="ts">
    import type { PostData, Thread, ThreadFilters } from "../../types";
    import InlineWriteForm from "./InlineWriteForm.svelte";
    import PostItem from "./PostItem.svelte";
    import ThreadFiltersComponent from "./ThreadFilters.svelte";

    import type {
        ShowIdPostsDetail,
        ShowPostContextMenuDetail,
        ShowReplyTreeDetail,
        ThreadLinkClickDetail,
    } from "./PostItem.svelte";
    import LoadingSpinner from "../common/LoadingSpinner.svelte";

    type Props = {
        thread: Thread | null;
        filters: ThreadFilters;
        isWriteFormVisible?: boolean;
        isSubmittingPost?: boolean;
        onPost: (postData: PostData) => Promise<void>;
        onJumpToPost?: (resNumber: number) => void;
        onShowReplyTree?: (detail: ShowReplyTreeDetail) => void;
        onShowIdPosts?: (detail: ShowIdPostsDetail) => void;
        onShowPostContextMenu?: (detail: ShowPostContextMenuDetail) => void;
        onThreadLinkClick?: (detail: ThreadLinkClickDetail) => void;
    };

    let {
        thread,
        filters = $bindable(),
        isWriteFormVisible = $bindable(false),
        isSubmittingPost = $bindable(false),
        onPost,
        onJumpToPost,
        onShowReplyTree,
        onShowIdPosts,
        onShowPostContextMenu,
        onThreadLinkClick,
    }: Props = $props();

    // フィルタリングロジックはViewの内部で行う
    const filteredPosts = $derived(() => {
        if (!thread?.posts) return [];

        return thread.posts.filter((post) => {
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
            // TODO: 他のフィルタ条件(video, externalなど)もここに追加
            return true;
        });
    });

    async function handlePost(postData: PostData) {
        await onPost(postData);
        // 投稿成功後、親の状態を更新してフォームを閉じる
        isWriteFormVisible = false;
    }
</script>

<div class="thread-view">
    {#if thread}
        <ThreadFiltersComponent bind:filters isVisible={true} />

        <div class="posts-list" role="feed">
            {#each filteredPosts() as post (post.resNum)}
                <PostItem
                    {post}
                    index={post.resNum - 1}
                    {onJumpToPost}
                    {onShowReplyTree}
                    {onShowIdPosts}
                    {onShowPostContextMenu}
                    {onThreadLinkClick}
                />
            {/each}
        </div>

        {#if isWriteFormVisible}
            <InlineWriteForm
                {handlePost}
                onCancel={() => (isWriteFormVisible = false)}
                bind:isSubmitting={isSubmittingPost}
            />
        {:else}
            <div class="write-form-trigger">
                <button
                    class="mod-cta"
                    onclick={() => (isWriteFormVisible = true)}
                >
                    書き込む
                </button>
            </div>
        {/if}
    {:else}
        <div class="loading-indicator">
            <LoadingSpinner />
        </div>
    {/if}
</div>

<style>
    .thread-view {
        display: flex;
        flex-direction: column;
        height: 100%;
    }
    .posts-list {
        flex: 1;
        overflow-y: auto; /* 投稿リスト部分をスクロール可能にする */
    }
    .write-form-trigger {
        padding: 1em 0;
        border-top: 1px solid var(--background-modifier-border);
    }
</style>
