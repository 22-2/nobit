<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import PostItem from "../components/PostItem.svelte";
    import CenterDecorator from "./helpers/CenterDecorator.svelte";
    import { fn } from "storybook/test";

    // サンプルデータの生成
    const generateBasicPost = () => ({
        resNum: 1,
        authorName: "名無しさん",
        mail: "",
        authorId: "ABC123",
        content: "これは基本的なポストの例です。",
        date: new Date("2024-01-01T10:00:00Z"),
        references: [],
        replies: [],
        hasImage: false,
        hasExternalLink: false,
        postIdCount: 1,
        siblingPostNumbers: [1],
        imageUrls: [],
    });

    const generatePostWithReplies = () => ({
        resNum: 1,
        authorName: "名無しさん",
        mail: "",
        authorId: "ABC123",
        content: "返信があるポストです。",
        date: new Date("2024-01-01T10:00:00Z"),
        references: [],
        replies: [2, 3, 5],
        hasImage: false,
        hasExternalLink: false,
        postIdCount: 1,
        siblingPostNumbers: [1],
        imageUrls: [],
    });

    const generatePostWithImages = () => ({
        resNum: 2,
        authorName: "名無しさん",
        mail: "",
        authorId: "DEF456",
        content: "画像付きのポストです。",
        date: new Date("2024-01-01T10:05:00Z"),
        references: [],
        replies: [],
        hasImage: true,
        hasExternalLink: false,
        postIdCount: 1,
        siblingPostNumbers: [2],
        imageUrls: [
            "https://via.placeholder.com/150x150/0066cc/ffffff?text=Image1",
            "https://via.placeholder.com/150x150/cc6600/ffffff?text=Image2",
        ],
    });

    const generatePostWithAnchors = () => ({
        resNum: 3,
        authorName: "名無しさん",
        mail: "sage",
        authorId: "GHI789",
        content:
            '<a class="internal-res-link" data-res-number="1">&gt;&gt;1</a> <a class="internal-res-link" data-res-number="2">&gt;&gt;2</a> アンカー付きのポストです。',
        date: new Date("2024-01-01T10:10:00Z"),
        references: [1, 2],
        replies: [],
        hasImage: false,
        hasExternalLink: false,
        postIdCount: 1,
        siblingPostNumbers: [3],
        imageUrls: [],
    });

    const generatePostWithMultipleIds = () => ({
        resNum: 4,
        authorName: "名無しさん",
        mail: "",
        authorId: "JKL012",
        content: "同じIDで複数回投稿しているユーザーです。",
        date: new Date("2024-01-01T10:15:00Z"),
        references: [],
        replies: [],
        hasImage: false,
        hasExternalLink: false,
        postIdCount: 3,
        siblingPostNumbers: [4, 7, 9],
        imageUrls: [],
    });

    const generateLongContentPost = () => ({
        resNum: 5,
        authorName: "長文投稿者",
        mail: "",
        authorId: "LONG123",
        content: `これは非常に長いコンテンツのポストです。
複数行にわたって書かれており、改行も含まれています。

段落も分かれていて、読みやすさをテストするためのものです。
<a class="internal-res-link" data-res-number="1">&gt;&gt;1</a> のようなアンカーも含まれています。

さらに外部リンクも含まれています: https://example.com

最後の段落です。このように長いテキストがどのように表示されるかを確認できます。`,
        date: new Date("2024-01-01T10:20:00Z"),
        references: [1],
        replies: [6],
        hasImage: false,
        hasExternalLink: true,
        postIdCount: 1,
        siblingPostNumbers: [5],
        imageUrls: [],
    });

    const { Story } = defineMeta({
        title: "UI/PostItem",
        component: PostItem,
        tags: ["autodocs"],
        argTypes: {
            post: {
                control: false,
                description: "表示するポストオブジェクト",
            },
            index: {
                control: { type: "number", min: 0, max: 1000 },
                description: "ポストのインデックス（レス番号-1）",
            },
            onHoverPostLink: {
                action: "onHoverPostLink",
                description: "ポストリンクホバー時のコールバック",
            },
            onLeavePostLink: {
                action: "onLeavePostLink",
                description: "ポストリンクから離れた時のコールバック",
            },
            onJumpToPost: {
                action: "onJumpToPost",
                description: "ポストジャンプ時のコールバック",
            },
            onShowReplyTree: {
                action: "onShowReplyTree",
                description: "返信ツリー表示時のコールバック",
            },
            onShowIdPosts: {
                action: "onShowIdPosts",
                description: "ID投稿一覧表示時のコールバック",
            },
            onShowPostContextMenu: {
                action: "onShowPostContextMenu",
                description: "ポストコンテキストメニュー表示時のコールバック",
            },
            onThreadLinkClick: {
                action: "onThreadLinkClick",
                description: "スレッドリンククリック時のコールバック",
            },
        },
        decorators: [
            (StoryComponent) => ({
                Component: CenterDecorator,
                props: {
                    children: StoryComponent,
                    padding: "var(--size-4-4)",
                    minHeight: "var(--size-4-50)",
                },
            }),
        ],
    });
</script>

<!-- 基本的なポスト -->
<Story
    name="Default"
    args={{
        post: generateBasicPost(),
        index: 0,
        onHoverPostLink: fn(),
        onLeavePostLink: fn(),
        onJumpToPost: fn(),
        onShowReplyTree: fn(),
        onShowIdPosts: fn(),
        onShowPostContextMenu: fn(),
        onThreadLinkClick: fn(),
    }}
/>

<!-- 返信があるポスト -->
<Story
    name="With Replies"
    args={{
        post: generatePostWithReplies(),
        index: 0,
        onHoverPostLink: fn(),
        onLeavePostLink: fn(),
        onJumpToPost: fn(),
        onShowReplyTree: fn(),
        onShowIdPosts: fn(),
        onShowPostContextMenu: fn(),
        onThreadLinkClick: fn(),
    }}
/>

<!-- 画像付きポスト -->
<Story
    name="With Images"
    args={{
        post: generatePostWithImages(),
        index: 1,
        onHoverPostLink: fn(),
        onLeavePostLink: fn(),
        onJumpToPost: fn(),
        onShowReplyTree: fn(),
        onShowIdPosts: fn(),
        onShowPostContextMenu: fn(),
        onThreadLinkClick: fn(),
    }}
/>

<!-- アンカー付きポスト -->
<Story
    name="With Anchors"
    args={{
        post: generatePostWithAnchors(),
        index: 2,
        onHoverPostLink: fn(),
        onLeavePostLink: fn(),
        onJumpToPost: fn(),
        onShowReplyTree: fn(),
        onShowIdPosts: fn(),
        onShowPostContextMenu: fn(),
        onThreadLinkClick: fn(),
    }}
/>

<!-- 複数ID投稿ユーザー -->
<Story
    name="Multiple ID Posts"
    args={{
        post: generatePostWithMultipleIds(),
        index: 3,
        onHoverPostLink: fn(),
        onLeavePostLink: fn(),
        onJumpToPost: fn(),
        onShowReplyTree: fn(),
        onShowIdPosts: fn(),
        onShowPostContextMenu: fn(),
        onThreadLinkClick: fn(),
    }}
/>

<!-- 長文ポスト -->
<Story
    name="Long Content"
    args={{
        post: generateLongContentPost(),
        index: 4,
        onHoverPostLink: fn(),
        onLeavePostLink: fn(),
        onJumpToPost: fn(),
        onShowReplyTree: fn(),
        onShowIdPosts: fn(),
        onShowPostContextMenu: fn(),
        onThreadLinkClick: fn(),
    }}
/>

<!-- sageポスト -->
<Story
    name="Sage Post"
    args={{
        post: {
            ...generateBasicPost(),
            mail: "sage",
            authorName: "名無しさん",
            content: "sageで投稿されたポストです。",
        },
        index: 0,
        onHoverPostLink: fn(),
        onLeavePostLink: fn(),
        onJumpToPost: fn(),
        onShowReplyTree: fn(),
        onShowIdPosts: fn(),
        onShowPostContextMenu: fn(),
        onThreadLinkClick: fn(),
    }}
/>

<!-- 高いレス番号 -->
<Story
    name="High Res Number"
    args={{
        post: {
            ...generateBasicPost(),
            resNum: 999,
            content: "高いレス番号のポストです。",
        },
        index: 998,
        onHoverPostLink: fn(),
        onLeavePostLink: fn(),
        onJumpToPost: fn(),
        onShowReplyTree: fn(),
        onShowIdPosts: fn(),
        onShowPostContextMenu: fn(),
        onThreadLinkClick: fn(),
    }}
/>

<!-- 複数の画像とアンカーを含む複合ポスト -->
<Story
    name="Complex Post"
    args={{
        post: {
            resNum: 10,
            authorName: "複合投稿者",
            mail: "",
            authorId: "COMPLEX1",
            content: `<a class="internal-res-link" data-res-number="1">&gt;&gt;1</a> <a class="internal-res-link" data-res-number="5">&gt;&gt;5</a> 
複数の要素を含むポストです。

画像も複数枚添付されています。
外部リンクもあります: https://example.com`,
            date: new Date("2024-01-01T11:00:00Z"),
            references: [1, 5],
            replies: [11, 12],
            hasImage: true,
            hasExternalLink: true,
            postIdCount: 2,
            siblingPostNumbers: [10, 15],
            imageUrls: [
                "https://via.placeholder.com/150x150/cc0066/ffffff?text=Img1",
                "https://via.placeholder.com/150x150/0066cc/ffffff?text=Img2",
                "https://via.placeholder.com/150x150/66cc00/ffffff?text=Img3",
            ],
        },
        index: 9,
        onHoverPostLink: fn(),
        onLeavePostLink: fn(),
        onJumpToPost: fn(),
        onShowReplyTree: fn(),
        onShowIdPosts: fn(),
        onShowPostContextMenu: fn(),
        onThreadLinkClick: fn(),
    }}
/>
