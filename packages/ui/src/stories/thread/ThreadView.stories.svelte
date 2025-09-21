<!-- packages/ui/src/stories/thread/ThreadView.stories.svelte -->
<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import ThreadView from "../../view/thread/ThreadView.svelte";
    import CenterDecorator from "../helpers/CenterDecorator.svelte";

    const { Story } = defineMeta({
        title: "Thread/ThreadView",
        component: ThreadView,
        tags: ["autodocs"],
        argTypes: {
            thread: {
                control: "object",
                description: "表示するスレッドデータ",
            },
            filters: { control: "object", description: "フィルターの状態" },
            isWriteFormVisible: {
                control: "boolean",
                description: "書き込みフォームの表示状態",
            },
            isSubmittingPost: {
                control: "boolean",
                description: "投稿処理中かどうかのフラグ",
            },
            onPost: {
                action: "onPost",
                description: "投稿時に呼び出される関数",
            },
            onJumpToPost: { action: "onJumpToPost" },
            onShowReplyTree: { action: "onShowReplyTree" },
            onShowIdPosts: { action: "onShowIdPosts" },
            onShowPostContextMenu: { action: "onShowPostContextMenu" },
            onThreadLinkClick: { action: "onThreadLinkClick" },
        },
        decorators: [
            (StoryComponent) => ({
                Component: CenterDecorator,
                props: {
                    children: StoryComponent,
                    padding: "0",
                    style: "width: 100%; max-width: 800px; height: 90vh; border: 1px solid var(--background-modifier-border);",
                },
            }),
        ],
    });
</script>

<script lang="ts">
    import { fn } from "storybook/test";
    import type { Post, PostData, Thread, ThreadFilters } from "../../types";

    const mockPosts: Post[] = [
        {
            authorName: "名無しさん",
            authorId: "ABCDE",
            date: new Date("2025-09-20T10:00:00Z"),
            content: "これは最初の投稿です。特定のキーワードを含みます。",
            imageUrls: [],
            replies: [3],
            postIdCount: 2,
            siblingPostNumbers: [1, 4],
            hasExternalLink: false,
            hasImage: false,
            mail: "",
            references: [],
        },
        {
            authorName: "名無しさん",
            authorId: "FGHIJ",
            date: new Date("2025-09-20T10:05:00Z"),
            content: `これは画像付きの投稿です。<a class="internal-res-link" href="#" data-res-number="1">&gt;&gt;1</a>へのアンカー。`,
            imageUrls: ["https://localhost/150x150/0066cc/ffffff?text=Image"],
            replies: [],
            postIdCount: 1,
            siblingPostNumbers: [2],
            hasExternalLink: true,
            hasImage: true,
            mail: "",
            references: [],
        },
        {
            authorName: "別の名無しさん",
            authorId: "KLMNO",
            date: new Date("2025-09-20T10:10:00Z"),
            content: "これは3番目の投稿です。",
            imageUrls: [],
            replies: [],
            postIdCount: 1,
            siblingPostNumbers: [3],
            hasExternalLink: false,
            hasImage: false,
            mail: "",
            references: [],
        },
        {
            authorName: "名無しさん",
            authorId: "ABCDE",
            date: new Date("2025-09-20T10:15:00Z"),
            content: "同じIDからの投稿です。",
            imageUrls: [],
            replies: [],
            postIdCount: 2,
            siblingPostNumbers: [1, 4],
            hasExternalLink: false,
            hasImage: false,
            mail: "",
            references: [],
        },
    ].map((post, index) => ({ ...post, resNum: index }));

    const generateSampleThread = (): Thread => ({
        url: "https://example.com/thread/123",
        title: "これはサンプルスレッドのタイトルです",
        posts: JSON.parse(JSON.stringify(mockPosts)),
    });

    const generateDefaultFilters = (): ThreadFilters => ({
        popular: false,
        image: false,
        video: false,
        external: false,
        internal: false,
        searchText: "",
    });

    let interactiveState = $state({
        thread: generateSampleThread(),
        filters: generateDefaultFilters(),
        isWriteFormVisible: false,
        isSubmittingPost: false,
    });

    async function handleInteractivePost(
        postData: PostData,
        onPostAction: (...args: any[]) => void
    ) {
        onPostAction(postData);
        interactiveState.isSubmittingPost = true;
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const newPost: Post = {
            resNum: interactiveState.thread.posts.length + 1,
            authorName: postData.name || "名無しさん",
            authorId: "YOU",
            date: new Date(),
            content: postData.content,
            imageUrls: [],
            replies: [],
            postIdCount: 1,
            siblingPostNumbers: [interactiveState.thread.posts.length + 1],
            hasExternalLink: false,
            hasImage: false,
            mail: postData.mail || "",
            references: [],
        };
        interactiveState.thread.posts = [
            ...interactiveState.thread.posts,
            newPost,
        ];
        interactiveState.isSubmittingPost = false;
        interactiveState.isWriteFormVisible = false;
    }
</script>

<!-- 基本的な表示 -->
<Story
    name="Default"
    args={{
        thread: generateSampleThread(),
        filters: generateDefaultFilters(),
        isWriteFormVisible: false,
        isSubmittingPost: false,
    }}
/>

<!-- 読み込み中の状態 -->
<Story
    name="Loading"
    args={{
        thread: null,
        filters: generateDefaultFilters(),
        isWriteFormVisible: false,
        isSubmittingPost: false,
    }}
/>

<!-- 投稿が一件もないスレッド -->
<Story
    name="Empty Thread"
    args={{
        thread: { ...generateSampleThread(), posts: [] },
        filters: generateDefaultFilters(),
        isWriteFormVisible: true,
        isSubmittingPost: false,
    }}
/>

<!-- フィルターが適用された状態 -->
<Story
    name="With Filters Applied"
    args={{
        thread: generateSampleThread(),
        filters: {
            ...generateDefaultFilters(),
            image: true,
        },
        isWriteFormVisible: false,
        isSubmittingPost: false,
    }}
/>

<!-- 書き込みフォームが最初から表示されている状態 -->
<Story
    name="Write Form Visible"
    args={{
        thread: generateSampleThread(),
        filters: generateDefaultFilters(),
        isWriteFormVisible: true,
        isSubmittingPost: false,
        onPost: fn(async (postData) => {
            await new Promise((resolve) => setTimeout(resolve, 1500));
        }),
    }}
/>

<!-- 投稿処理中の状態 -->
<Story
    name="Submitting Post"
    args={{
        thread: generateSampleThread(),
        filters: generateDefaultFilters(),
        isWriteFormVisible: true,
        isSubmittingPost: true,
    }}
/>

<!-- インタラクティブな総合テスト (修正版) -->
<Story
    name="Interactive"
    let:args
    args={{
        // Storybookの初期レンダリング用に `args` を設定
        thread: interactiveState.thread,
        filters: interactiveState.filters,
        isWriteFormVisible: interactiveState.isWriteFormVisible,
        isSubmittingPost: interactiveState.isSubmittingPost,
    }}
>
    <div
        style="position: absolute; top: 10px; left: 10px; z-index: 100; background: var(--background-secondary); padding: 8px; border-radius: 4px; font-size: 12px;"
    >
        <p>isWriteFormVisible: {interactiveState.isWriteFormVisible}</p>
        <p>isSubmittingPost: {interactiveState.isSubmittingPost}</p>
    </div>

    <ThreadView
        thread={interactiveState.thread}
        bind:filters={interactiveState.filters}
        bind:isWriteFormVisible={interactiveState.isWriteFormVisible}
        bind:isSubmittingPost={interactiveState.isSubmittingPost}
        onPost={(postData) => handleInteractivePost(postData, args.onPost)}
        onJumpToPost={args.onJumpToPost}
        onShowReplyTree={args.onShowReplyTree}
        onShowIdPosts={args.onShowIdPosts}
        onShowPostContextMenu={args.onShowPostContextMenu}
        onThreadLinkClick={args.onThreadLinkClick}
    />
</Story>
