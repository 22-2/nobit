<!-- src/lib/components/chat/ChatPostList.svelte -->
<script lang="ts">
    import type { Post } from "../../types";

    type Props = {
        posts: Post[];
        userHasScrolledUp: boolean;
        onUserHasScrolledUpChange: (value: boolean) => void;
    };

    let { posts, onUserHasScrolledUpChange, userHasScrolledUp }: Props =
        $props(); // $props() を使用

    let _containerEl: HTMLDivElement | undefined = $state();
    const MAX_POSTS_TO_DISPLAY = 100;

    const displayedPostsWithIndex = $derived(() => {
        const startIndex =
            posts.length > MAX_POSTS_TO_DISPLAY
                ? posts.length - MAX_POSTS_TO_DISPLAY
                : 0;
        return posts.slice(startIndex).map((post, i) => ({
            post,
            originalIndex: startIndex + i,
        }));
    });

    function handleScroll() {
        if (!_containerEl) return;
        const buffer = 10;
        const atBottom =
            _containerEl.scrollHeight -
                _containerEl.scrollTop -
                _containerEl.clientHeight <
            buffer;
        // 状態が変化したときのみ親に通知
        if (userHasScrolledUp === atBottom) {
            onUserHasScrolledUpChange?.(!atBottom);
        }
    }

    // 初回マウント時に最下部へスクロール
    $effect(() => {
        if (_containerEl && posts.length > 0) {
            const timer = setTimeout(() => {
                scrollToBottom();
                handleScroll(); // userHasScrolledUpの初期状態を設定
            }, 50);
            return () => clearTimeout(timer);
        }
    });

    // --- Public API ---
    export function scrollToBottom() {
        if (_containerEl) {
            _containerEl.scrollTo({
                top: _containerEl.scrollHeight,
                behavior: "instant",
            });
            // 手動で一番下にスクロールした場合、上にスクロールした状態をリセット
            if (userHasScrolledUp) {
                onUserHasScrolledUpChange?.(false);
            }
        }
    }

    export const imports = {
        get containerEl() {
            return _containerEl;
        },
        set containerEl(value) {
            _containerEl = value;
        },
    };
    // [Svelte 5 exports in rune mode to expose variables for programmatic use (for instance updates) · Issue #11974 · sveltejs/svelte](https://github.com/sveltejs/svelte/issues/11974)
</script>

<div
    class="live-chat-container"
    bind:this={_containerEl}
    onscroll={handleScroll}
>
    {#each displayedPostsWithIndex() as { post, originalIndex } (originalIndex)}
        <div class="live-chat-item" class:odd={originalIndex % 2 !== 0}>
            <span class="live-chat-number">{originalIndex + 1}:</span>
            <span class="live-chat-content">{@html post.content}</span>
        </div>
    {/each}
</div>

<style>
    .live-chat-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow-y: auto;
        position: relative;
    }
    .live-chat-item {
        line-height: 1.5;
        padding: 0.4em 1em;
    }
    .live-chat-item.odd {
        background-color: var(--nobit-background-secondary);
    }
    .live-chat-number {
        font-weight: bold;
        margin-right: 0.5em;
        color: var(--nobit-text-muted);
    }
    .live-chat-content {
        word-wrap: break-word;
        white-space: pre-wrap;
    }
    .live-chat-content :global(img) {
        max-width: 100px;
        max-height: 100px;
        vertical-align: middle;
    }
    .live-chat-content :global(a) {
        color: var(--nobit-text-accent);
    }
</style>
