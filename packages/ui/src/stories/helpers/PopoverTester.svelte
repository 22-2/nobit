<script lang="ts">
    import { usePopover } from "../../stores/usePopover.svelte";
    import type { Thread } from "../../types";

    interface Props {
        threadData?: Thread | null;
        showTestPosts?: boolean;
        containerHeight?: string;
        containerWidth?: string;
    }

    let {
        threadData = null,
        showTestPosts = true,
        containerHeight = "400px",
        containerWidth = "600px",
    }: Props = $props();

    // テスト用のサンプルデータ
    const sampleThread: Thread = {
        id: "test-thread",
        title: "テストスレッド",
        url: "https://example.com/test",
        resCount: 3,
        posts: [
            {
                resNum: 1,
                authorName: "名無しさん",
                mail: "",
                authorId: "ID:test001",
                content: "これは最初のレスです。",
                date: new Date("2024-01-01T10:00:00"),
                references: [],
                replies: [2],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [1],
            },
            {
                resNum: 2,
                authorName: "名無しさん",
                mail: "",
                authorId: "ID:test002",
                content: ">>1 これは返信レスです。",
                date: new Date("2024-01-01T10:05:00"),
                references: [1],
                replies: [],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [2],
            },
            {
                resNum: 3,
                authorName: "名無しさん",
                mail: "",
                authorId: "ID:test003",
                content: "これは3番目のレスです。画像付きです。",
                date: new Date("2024-01-01T10:10:00"),
                references: [],
                replies: [],
                hasImage: true,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [3],
                imageUrls: ["https://example.com/image.jpg"],
            },
        ],
    };

    let popoverContainer: HTMLElement;
    const popover = usePopover();

    $effect(() => {
        if (popoverContainer) {
            popover.init(popoverContainer);
            popover.setThreadData(threadData || sampleThread);
        }

        return () => {
            popover.destroy();
        };
    });

    function handlePostLinkClick(postIndex: number, event: MouseEvent) {
        const target = event.target as HTMLElement;
        popover.handleHover(target, postIndex, 0, event);
    }

    function handleReplyTreeClick(originResNumber: number, event: MouseEvent) {
        const target = event.target as HTMLElement;
        popover.handleShowReplyTree(target, originResNumber, 0, event);
    }
</script>

<div
    class="popover-tester"
    style="height: {containerHeight}; width: {containerWidth};"
    data-testid="popover-tester"
>
    <div class="content-area">
        <h3>Popover テスト</h3>

        {#if showTestPosts}
            <div class="test-posts">
                <h4>テスト用投稿リンク</h4>
                <div class="post-links">
                    <button
                        class="post-link"
                        onclick={(e) => handlePostLinkClick(0, e)}
                        data-testid="post-link-1"
                    >
                        >>1 (最初のレス)
                    </button>
                    <button
                        class="post-link"
                        onclick={(e) => handlePostLinkClick(1, e)}
                        data-testid="post-link-2"
                    >
                        >>2 (返信レス)
                    </button>
                    <button
                        class="post-link"
                        onclick={(e) => handlePostLinkClick(2, e)}
                        data-testid="post-link-3"
                    >
                        >>3 (画像付きレス)
                    </button>
                </div>

                <h4>返信ツリー表示</h4>
                <div class="reply-tree-links">
                    <button
                        class="reply-tree-link"
                        onclick={(e) => handleReplyTreeClick(1, e)}
                        data-testid="reply-tree-1"
                    >
                        レス1の返信ツリー
                    </button>
                    <button
                        class="reply-tree-link"
                        onclick={(e) => handleReplyTreeClick(2, e)}
                        data-testid="reply-tree-2"
                    >
                        レス2の返信ツリー
                    </button>
                </div>
            </div>
        {/if}

        <div class="popover-info">
            <h4>
                アクティブなポップオーバー数: {popover.activePopovers.length}
            </h4>
            <div class="actions">
                <button
                    onclick={() => popover.startHideTimer()}
                    data-testid="start-hide-timer"
                >
                    非表示タイマー開始
                </button>
            </div>
        </div>
    </div>

    <!-- ポップオーバーコンテナ -->
    <div
        class="popover-container"
        bind:this={popoverContainer}
        data-testid="popover-container"
    ></div>
</div>

<style>
    .popover-tester {
        position: relative;
        border: 1px solid var(--background-modifier-border);
        border-radius: 8px;
        padding: 16px;
        background: var(--background-primary);
        overflow: hidden;
    }

    .content-area {
        height: 100%;
        overflow-y: auto;
    }

    .test-posts {
        margin-bottom: 20px;
    }

    .post-links,
    .reply-tree-links {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;
    }

    .post-link,
    .reply-tree-link {
        padding: 6px 12px;
        background: var(--interactive-accent);
        color: var(--text-on-accent);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.2s;
    }

    .post-link:hover,
    .reply-tree-link:hover {
        background: var(--interactive-accent-hover);
    }

    .popover-info {
        padding: 12px;
        background: var(--background-secondary);
        border-radius: 4px;
        margin-bottom: 16px;
    }

    .actions {
        margin-top: 8px;
    }

    .actions button {
        padding: 6px 12px;
        background: var(--interactive-normal);
        color: var(--text-normal);
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    }

    .actions button:hover {
        background: var(--interactive-hover);
    }

    .popover-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
    }

    .popover-container :global(.popover) {
        pointer-events: auto;
    }

    h3,
    h4 {
        margin: 0 0 8px 0;
        color: var(--text-normal);
    }

    h3 {
        font-size: 16px;
    }

    h4 {
        font-size: 14px;
    }
</style>
