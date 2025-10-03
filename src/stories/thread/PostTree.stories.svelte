<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import PostTree from "../../view/thread/PostTree.svelte";
    import CenterDecorator from "../helpers/CenterDecorator.svelte";
    import { fn } from "storybook/test";

    // サンプルデータの生成
    const generateSampleThread = () => {
        const posts = [
            {
                resNum: 1,
                authorName: "名無しさん",
                mail: "",
                authorId: "ABC123",
                content: "スレッドを立てました。よろしくお願いします。",
                date: new Date("2024-01-01T10:00:00Z"),
                references: [],
                replies: [2, 3],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [1],
                imageUrls: [],
            },
            {
                resNum: 2,
                authorName: "名無しさん",
                mail: "sage",
                authorId: "DEF456",
                content:
                    '<a class="internal-res-link" data-res-number="1">&gt;&gt;1</a> ありがとうございます！',
                date: new Date("2024-01-01T10:05:00Z"),
                references: [1],
                replies: [4],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [2],
                imageUrls: [],
            },
            {
                resNum: 3,
                authorName: "名無しさん",
                mail: "",
                authorId: "GHI789",
                content:
                    '<a class="internal-res-link" data-res-number="1">&gt;&gt;1</a> 参加します',
                date: new Date("2024-01-01T10:10:00Z"),
                references: [1],
                replies: [],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [3],
                imageUrls: [],
            },
            {
                resNum: 4,
                authorName: "名無しさん",
                mail: "",
                authorId: "JKL012",
                content:
                    '<a class="internal-res-link" data-res-number="2">&gt;&gt;2</a> よろしくお願いします',
                date: new Date("2024-01-01T10:15:00Z"),
                references: [2],
                replies: [],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [4],
                imageUrls: [],
            },
        ];

        return {
            title: "サンプルスレッド",
            posts,
            url: "https://example.5ch.net/test/read.cgi/sample/1234567890/",
            id: "1234567890",
            resCount: posts.length,
        };
    };

    const generateDeepThread = () => {
        const posts = [
            {
                resNum: 1,
                authorName: "名無しさん",
                mail: "",
                authorId: "ABC123",
                content: "深いツリー構造のテストスレッドです",
                date: new Date("2024-01-01T10:00:00Z"),
                references: [],
                replies: [2],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [1],
                imageUrls: [],
            },
            {
                resNum: 2,
                authorName: "名無しさん",
                mail: "",
                authorId: "DEF456",
                content:
                    '<a class="internal-res-link" data-res-number="1">&gt;&gt;1</a> レベル1の返信',
                date: new Date("2024-01-01T10:05:00Z"),
                references: [1],
                replies: [3],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [2],
                imageUrls: [],
            },
            {
                resNum: 3,
                authorName: "名無しさん",
                mail: "",
                authorId: "GHI789",
                content:
                    '<a class="internal-res-link" data-res-number="2">&gt;&gt;2</a> レベル2の返信',
                date: new Date("2024-01-01T10:10:00Z"),
                references: [2],
                replies: [4],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [3],
                imageUrls: [],
            },
            {
                resNum: 4,
                authorName: "名無しさん",
                mail: "",
                authorId: "JKL012",
                content:
                    '<a class="internal-res-link" data-res-number="3">&gt;&gt;3</a> レベル3の返信',
                date: new Date("2024-01-01T10:15:00Z"),
                references: [3],
                replies: [5],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [4],
                imageUrls: [],
            },
            {
                resNum: 5,
                authorName: "名無しさん",
                mail: "",
                authorId: "MNO345",
                content:
                    '<a class="internal-res-link" data-res-number="4">&gt;&gt;4</a> レベル4の返信（最深部）',
                date: new Date("2024-01-01T10:20:00Z"),
                references: [4],
                replies: [],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [5],
                imageUrls: [],
            },
        ];

        return {
            title: "深いツリー構造テストスレッド",
            posts,
            url: "https://example.5ch.net/test/read.cgi/sample/1234567891/",
            id: "1234567891",
            resCount: posts.length,
        };
    };

    const generateMultipleRepliesThread = () => {
        const posts = [
            {
                resNum: 1,
                authorName: "名無しさん",
                mail: "",
                authorId: "ABC123",
                content: "複数の返信があるポストです",
                date: new Date("2024-01-01T10:00:00Z"),
                references: [],
                replies: [2, 3, 4, 5],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [1],
                imageUrls: [],
            },
            {
                resNum: 2,
                authorName: "名無しさん",
                mail: "",
                authorId: "DEF456",
                content: "返信1",
                date: new Date("2024-01-01T10:05:00Z"),
                references: [1],
                replies: [],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [2],
                imageUrls: [],
            },
            {
                resNum: 3,
                authorName: "名無しさん",
                mail: "",
                authorId: "GHI789",
                content: "返信2",
                date: new Date("2024-01-01T10:10:00Z"),
                references: [1],
                replies: [],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [3],
                imageUrls: [],
            },
            {
                resNum: 4,
                authorName: "名無しさん",
                mail: "",
                authorId: "JKL012",
                content: "返信3",
                date: new Date("2024-01-01T10:15:00Z"),
                references: [1],
                replies: [],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [4],
                imageUrls: [],
            },
            {
                resNum: 5,
                authorName: "名無しさん",
                mail: "",
                authorId: "MNO345",
                content: "返信4",
                date: new Date("2024-01-01T10:20:00Z"),
                references: [1],
                replies: [],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [5],
                imageUrls: [],
            },
        ];
        return {
            title: "複数返信テストスレッド",
            posts,
            url: "https://example.5ch.net/test/read.cgi/sample/1234567892/",
            id: "1234567892",
            resCount: posts.length,
        };
    };

    const { Story } = defineMeta({
        title: "Thread/PostTree",
        component: PostTree,
        tags: ["autodocs"],
        argTypes: {
            post: {
                control: false,
                description: "表示するポストオブジェクト",
            },
            thread: {
                control: false,
                description: "スレッドオブジェクト",
            },
            level: {
                control: { type: "number", min: 0, max: 10 },
                description: "ツリーの深さレベル",
            },
            onHoverPostLink: {
                action: "onHoverPostLink",
                description: "ポストリンクホバー時のコールバック",
            },
            onShowReplyTree: {
                action: "onShowReplyTree",
                description: "返信ツリー表示時のコールバック",
            },
        },
        decorators: [
            (StoryComponent) => ({
                Component: CenterDecorator,
                props: {
                    children: StoryComponent,
                    padding: "var(--size-4-4)",
                    minHeight: "var(--size-4-100)",
                },
            }),
        ],
    });
</script>

<!-- デフォルトの状態 -->
<Story
    name="Default"
    args={{
        post: generateSampleThread().posts[0],
        thread: generateSampleThread(),
        level: 0,
        onHoverPostLink: fn(),
        onShowReplyTree: fn(),
    }}
/>

<!-- 返信がないポスト -->
<Story
    name="No Replies"
    args={{
        post: generateSampleThread().posts[2], // 返信がないポスト
        thread: generateSampleThread(),
        level: 0,
        onHoverPostLink: fn(),
        onShowReplyTree: fn(),
    }}
/>

<!-- レベル1のツリー -->
<Story
    name="Level 1"
    args={{
        post: generateSampleThread().posts[0],
        thread: generateSampleThread(),
        level: 1,
        onHoverPostLink: fn(),
        onShowReplyTree: fn(),
    }}
/>

<!-- レベル2のツリー -->
<Story
    name="Level 2"
    args={{
        post: generateSampleThread().posts[0],
        thread: generateSampleThread(),
        level: 2,
        onHoverPostLink: fn(),
        onShowReplyTree: fn(),
    }}
/>

<!-- 深いツリー構造 -->
<Story
    name="Deep Tree"
    args={{
        post: generateDeepThread().posts[0],
        thread: generateDeepThread(),
        level: 0,
        onHoverPostLink: fn(),
        onShowReplyTree: fn(),
    }}
/>

<!-- 複数の返信があるポスト -->
<Story
    name="Multiple Replies"
    args={{
        post: generateMultipleRepliesThread().posts[0],
        thread: generateMultipleRepliesThread(),
        level: 0,
        onHoverPostLink: fn(),
        onShowReplyTree: fn(),
    }}
/>
