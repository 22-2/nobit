<!-- src/components/PostItem.svelte -->
<script lang="ts">
    import type { Post } from "../../types";
    import { formatDate } from "../../utils/index";

    export type HoverDetail = {
        targetEl: HTMLElement;
        post: Post;
        index: number;
        event: MouseEvent;
    };

    export type ShowReplyTreeDetail = {
        targetEl: HTMLElement;
        originResNumber: number;
        event: MouseEvent;
    };

    export type ShowIdPostsDetail = {
        targetEl: HTMLElement;
        post: Post; // <<< [修正] postプロパティを追加
        siblingPostNumbers: number[];
        event: MouseEvent;
    };

    export type ShowPostContextMenuDetail = {
        post: Post;
        index: number;
        event: MouseEvent;
    };

    export type ThreadLinkClickDetail = {
        url: string;
        event: MouseEvent;
    };

    let {
        post,
        index,
        onHoverPostLink,
        onLeavePostLink,
        onJumpToPost,
        onShowReplyTree,
        onShowIdPosts,
        onShowPostContextMenu,
        onThreadLinkClick,
    } = $props<{
        post: Post;
        index: number;
        onHoverPostLink?: (detail: HoverDetail) => void;
        onLeavePostLink?: () => void;
        onJumpToPost?: (resNumber: number) => void;
        onShowReplyTree?: (detail: ShowReplyTreeDetail) => void;
        onShowIdPosts?: (detail: ShowIdPostsDetail) => void;
        onShowPostContextMenu?: (detail: ShowPostContextMenuDetail) => void;
        onThreadLinkClick?: (detail: ThreadLinkClickDetail) => void;
    }>();

    function handleMouseOver(event: MouseEvent) {
        if (!onHoverPostLink) return;

        const target = event.target as HTMLElement;
        const linkEl = target.closest<HTMLElement>(".internal-res-link");

        if (!linkEl || !linkEl.dataset.resNumber) return;

        event.stopPropagation();

        const resNumber = parseInt(linkEl.dataset.resNumber, 10);
        const postIndex = resNumber - 1;

        onHoverPostLink({
            targetEl: linkEl,
            post: {} as Post,
            index: postIndex,
            event,
        });
    }

    function handleMouseOut(event: MouseEvent) {
        if (!onLeavePostLink) return;

        const target = event.target as HTMLElement;
        const linkEl = target.closest<HTMLElement>(".internal-res-link");

        if (linkEl) {
            onLeavePostLink();
        }
    }

    function handleClick(event: MouseEvent) {
        const target = event.target as HTMLElement;

        const externalLink = target.closest<HTMLAnchorElement>(
            "a[href*='/test/read.cgi/']"
        );
        if (externalLink && onThreadLinkClick) {
            const url = externalLink.href;
            const urlRegex =
                /https?:\/\/([^/]+)\/test\/read\.cgi\/([^/]+)\/(\d+)/;
            if (urlRegex.test(url)) {
                event.preventDefault();
                event.stopPropagation();
                onThreadLinkClick({ url, event });
                return;
            }
        }

        const triggerEl = target.closest<HTMLElement>(
            ".internal-res-link, .reply-tree-link, .post-author-id a"
        );

        if (!triggerEl) return;

        event.preventDefault();
        event.stopPropagation();

        const resNumberStr = triggerEl.dataset.resNumber;
        if (resNumberStr) {
            const resNumber = parseInt(resNumberStr, 10);
            if (isNaN(resNumber)) return;

            // アンカーリンク（>>1）の場合
            if (triggerEl.matches(".internal-res-link") && onJumpToPost) {
                onJumpToPost(resNumber);
            }
            // 返信ツリーを開くリンクの場合
            else if (triggerEl.matches(".reply-tree-link") && onShowReplyTree) {
                onShowReplyTree({
                    targetEl: triggerEl,
                    originResNumber: resNumber,
                    event,
                });
            }
        } else if (triggerEl.matches(".post-author-id a") && onShowIdPosts) {
            onShowIdPosts({
                targetEl: triggerEl,
                post, // <<< [修正] postオブジェクトを渡す
                siblingPostNumbers: post.siblingPostNumbers,
                event,
            });
        }
    }

    function handleContextMenu(event: MouseEvent) {
        if (!onShowPostContextMenu) return;
        event.preventDefault();
        event.stopPropagation();
        onShowPostContextMenu({ post, index, event });
    }
</script>

<div
    class="post"
    id="res-{index + 1}"
    data-res-number={index + 1}
    role="article"
    aria-labelledby="post-header-{index + 1}"
    onmouseover={handleMouseOver}
    onmouseout={handleMouseOut}
    onclick={handleClick}
    oncontextmenu={handleContextMenu}
>
    <div class="post-header" id="post-header-{index + 1}">
        <span class="post-number">{index + 1}:</span>
        <span class="post-name">{post.authorName}</span>
        <span class="post-author-id">
            ID:
            {#if post.postIdCount > 1}
                <a href="#" class="id-link">{post.authorId}</a>
                ({post.postIdCount})
            {:else}
                {post.authorId}
            {/if}
        </span>
        <span class="post-date">{formatDate(post.date)}</span>
        <!-- このレスへの返信（被参照）があれば表示 -->
        {#if post.replies.length > 0}
            <span class="post-replies">
                <a class="reply-tree-link" data-res-number={index + 1} href="#">
                    返信 ({post.replies.length})
                </a>
            </span>
        {/if}
    </div>
    <div class="post-content">
        {@html post.content}
    </div>
    {#if post.imageUrls && post.imageUrls.length > 0}
        <div class="image-gallery">
            {#each post.imageUrls as url}
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="thumbnail-link"
                >
                    <img
                        src={url}
                        class="thumbnail-image"
                        alt="thumbnail"
                        loading="lazy"
                    />
                </a>
            {/each}
        </div>
    {/if}
</div>

<style>
    .post {
        padding-bottom: 1em;
        border-bottom: 1px solid var(--background-modifier-border);
    }

    .post-header {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5em;
        font-size: 0.9em;
        color: var(--text-muted);
        margin-bottom: 0.5em;
    }

    .post-number {
        font-weight: bold;
        color: var(--text-normal);
    }

    .post-content {
        line-height: 1.6;
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    /* :global() を使って、子コンポーネントの a タグにスタイルを適用 */
    :global(.internal-res-link) {
        color: var(--text-accent);
        cursor: pointer;
        text-decoration: none;
        margin: 0 0.2em;
    }
    :global(.internal-res-link:hover) {
        text-decoration: underline;
    }

    /* 新しく追加した返信リストのスタイル */
    .post-replies {
        font-size: 0.85em;
        color: var(--text-muted);
        border-top: 1px dotted var(--background-modifier-border);
    }

    /* 返信ツリーリンクのスタイル */
    .reply-tree-link {
        color: var(--text-accent);
        cursor: pointer;
        text-decoration: none;
    }
    .reply-tree-link:hover {
        text-decoration: underline;
    }

    .id-link {
        color: var(--text-muted);
        text-decoration: none;
        cursor: pointer;
    }
    .id-link:hover {
        text-decoration: underline;
    }

    .image-gallery {
        display: flex;
        flex-wrap: wrap;
        gap: var(--size-4-2);
        margin-top: var(--size-4-2);
    }

    .thumbnail-link {
        display: block;
        border: 1px solid var(--background-modifier-border);
        border-radius: var(--size-4-1);
        overflow: hidden;
        line-height: 0;
        width: var(--size-4-30);
        height: var(--size-4-30);
    }

    .thumbnail-link:hover {
        border-color: var(--interactive-accent);
    }

    .thumbnail-image {
        object-fit: cover;
    }
</style>
