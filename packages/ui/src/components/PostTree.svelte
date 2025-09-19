<script lang="ts">
    import type { Post, Thread } from "../types";
    import { popoverService } from "../popover/popoverService.svelte";
    import PostTree from "./PostTree.svelte";
    import PostItem from "./PostItem.svelte";

    type HoverDetail = {
        targetEl: HTMLElement;
        index: number;
        event: MouseEvent;
    };

    type ShowReplyTreeDetail = {
        targetEl: HTMLElement;
        originResNumber: number;
        event: MouseEvent;
    };

    let {
        post,
        thread,
        level = 0,
        onHoverPostLink,
        onShowReplyTree,
    }: {
        post: Post;
        thread: Thread;
        level?: number;
        onHoverPostLink: (detail: HoverDetail) => void;
        onShowReplyTree: (detail: ShowReplyTreeDetail) => void;
    } = $props();

    const replies = post.replies
        .map((replyNum) => thread.posts[replyNum - 1])
        .filter((p): p is Post => p !== undefined);
</script>

<div class="post-tree-node" style="--level: {level}">
    <PostItem
        {post}
        index={thread.posts.indexOf(post)}
        {onHoverPostLink}
        onLeavePostLink={() => {
            popoverService.startHideTimer();
        }}
    />
    {#if replies.length > 0}
        <div class="post-tree-replies">
            {#each replies as reply}
                <PostTree
                    post={reply}
                    {thread}
                    level={level + 1}
                    {onHoverPostLink}
                    {onShowReplyTree}
                />
            {/each}
        </div>
    {/if}
</div>

<style>
    .post-tree-node {
        /* prettier-ignore */
        margin-left: calc(var(--level) * 12px);
        border-left: 2px solid var(--background-modifier-border);
        padding-left: var(--size-4-2);
        contain: content;
    }
    .post-tree-replies {
        margin-top: 2px;
    }
</style>
