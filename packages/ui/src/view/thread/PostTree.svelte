<script lang="ts">
    import type { Post, Thread } from "../../types";
    // PostItemから型定義をインポート
    import type {
        HoverDetail,
        ShowReplyTreeDetail,
        ShowIdPostsDetail,
        ShowPostContextMenuDetail,
        ThreadLinkClickDetail,
    } from "./PostItem.svelte";
    import PostTree from "./PostTree.svelte";
    import PostItem from "./PostItem.svelte";
    import { usePopover } from "../../stores/usePopover.svelte";

    let {
        post,
        thread,
        level = 0,
        onHoverPostLink,
        onLeavePostLink,
        onJumpToPost,
        onShowReplyTree,
        onShowIdPosts,
        onShowPostContextMenu,
        onThreadLinkClick,
    }: {
        post: Post;
        thread: Thread;
        level?: number;
        // PostItemに合わせてオプショナルにする
        onHoverPostLink?: (detail: HoverDetail) => void;
        onLeavePostLink?: () => void;
        onJumpToPost?: (resNumber: number) => void;
        onShowReplyTree?: (detail: ShowReplyTreeDetail) => void;
        onShowIdPosts?: (detail: ShowIdPostsDetail) => void;
        onShowPostContextMenu?: (detail: ShowPostContextMenuDetail) => void;
        onThreadLinkClick?: (detail: ThreadLinkClickDetail) => void;
    } = $props();

    const replies = post.replies
        .map((replyNum) => thread.posts[replyNum - 1])
        .filter((p): p is Post => p !== undefined);

    const popover = usePopover();

    // --- [修正] onLeavePostLinkの処理をまとめる ---
    function handleLeavePostLink() {
        popover.startHideTimer();
        if (onLeavePostLink) {
            onLeavePostLink();
        }
    }
</script>

<div class="post-tree-node" style="--level: {level}">
    <!-- --- [修正] 全てのプロパティをPostItemに渡す --- -->
    <PostItem
        {post}
        index={thread.posts.indexOf(post)}
        {onHoverPostLink}
        onLeavePostLink={handleLeavePostLink}
        {onJumpToPost}
        {onShowReplyTree}
        {onShowIdPosts}
        {onShowPostContextMenu}
        {onThreadLinkClick}
    />
    {#if replies.length > 0}
        <div class="post-tree-replies">
            {#each replies as reply}
                <!-- --- [修正] 全てのプロパティを再帰的にPostTreeに渡す --- -->
                <PostTree
                    post={reply}
                    {thread}
                    level={level + 1}
                    {onHoverPostLink}
                    {onLeavePostLink}
                    {onJumpToPost}
                    {onShowReplyTree}
                    {onShowIdPosts}
                    {onShowPostContextMenu}
                    {onThreadLinkClick}
                />
            {/each}
        </div>
    {/if}
</div>

<style>
    .post-tree-node {
        /* prettier-ignore */
        margin-left: calc(var(--level) * var(--size-4-3));
        border-left: 2px solid var(--background-modifier-border);
        padding-left: var(--size-4-2);
        contain: content;
    }
    .post-tree-replies {
        margin-top: 2px;
    }
</style>
