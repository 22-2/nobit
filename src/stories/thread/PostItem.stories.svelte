<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import PostItem from "../../view/thread/PostItem.svelte";
    import CenterDecorator from "../helpers/CenterDecorator.svelte";
    import { fn } from "storybook/test";

    // 実際の5chデータ構造に基づくサンプルデータの生成
    const generateBasicPost = () => ({
        resNum: 1,
        authorName: "名無しさん@転載は禁止",
        mail: "",
        authorId: "ABC123DE",
        content: "これは基本的なポストの例です。<br>5chの実際のデータ構造に基づいています。",
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
        authorName: "名無しさん@転載は禁止",
        mail: "",
        authorId: "ABC123DE",
        content: "返信があるポストです。<br>このレスには複数の返信が付いています。",
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
        authorName: "名無しさん@転載は禁止",
        mail: "",
        authorId: "DEF456GH",
        content: "画像付きのポストです。<br>複数の画像が添付されています。",
        date: new Date("2024-01-01T10:05:00Z"),
        references: [],
        replies: [],
        hasImage: true,
        hasExternalLink: false,
        postIdCount: 1,
        siblingPostNumbers: [2],
        imageUrls: [
            "https://i.imgur.com/sample1.jpg",
            "https://i.imgur.com/sample2.png",
        ],
    });

    const generatePostWithAnchors = () => ({
        resNum: 3,
        authorName: "名無しさん@転載は禁止",
        mail: "sage",
        authorId: "GHI789JK",
        content:
            '<a class="internal-res-link" data-res-number="1">&gt;&gt;1</a> <a class="internal-res-link" data-res-number="2">&gt;&gt;2</a><br>アンカー付きのポストです。<br>複数のレスを参照しています。',
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
        authorName: "名無しさん@転載は禁止",
        mail: "",
        authorId: "JKL012MN",
        content: "同じIDで複数回投稿しているユーザーです。<br>このIDは3回投稿しています。",
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
        authorName: "長文投稿者@転載は禁止",
        mail: "",
        authorId: "LONG123OP",
        content: `これは非常に長いコンテンツのポストです。<br>複数行にわたって書かれており、改行も含まれています。<br><br>段落も分かれていて、読みやすさをテストするためのものです。<br><a class="internal-res-link" data-res-number="1">&gt;&gt;1</a> のようなアンカーも含まれています。<br><br>さらに外部リンクも含まれています: <a href="https://example.com" target="_blank">https://example.com</a><br><br>最後の段落です。このように長いテキストがどのように表示されるかを確認できます。<br>5chの実際の投稿では、このような長文も珍しくありません。`,
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
        title: "Thread/PostItem",
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
            authorName: "複合投稿者@転載は禁止",
            mail: "",
            authorId: "COMPLEX1QR",
            content: `<a class="internal-res-link" data-res-number="1">&gt;&gt;1</a> <a class="internal-res-link" data-res-number="5">&gt;&gt;5</a><br>複数の要素を含むポストです。<br><br>画像も複数枚添付されています。<br>外部リンクもあります: <a href="https://example.com" target="_blank">https://example.com</a>`,
            date: new Date("2024-01-01T11:00:00Z"),
            references: [1, 5],
            replies: [11, 12],
            hasImage: true,
            hasExternalLink: true,
            postIdCount: 2,
            siblingPostNumbers: [10, 15],
            imageUrls: [
                "https://i.imgur.com/complex1.jpg",
                "https://i.imgur.com/complex2.png",
                "https://i.imgur.com/complex3.gif",
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

<!-- 実際の5chデータ構造テスト -->
<Story
    name="Real 5ch Data Structure"
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
>
    <CenterDecorator padding="var(--size-4-4)" minHeight="var(--size-4-50)">
        <div style="width: 100%; max-width: 800px;">
            <h3 style="margin-bottom: var(--size-4-4); color: var(--text-normal);">
                実際の5chデータ構造との統合テスト
            </h3>
            <p style="margin-bottom: var(--size-4-4); color: var(--text-muted); font-size: 0.9em;">
                ThreadManagerから取得される実際の5chデータ構造に基づくテスト
            </p>
            
            <!-- 基本的な投稿 -->
            <div style="margin-bottom: var(--size-4-6);">
                <h4 style="color: var(--text-normal); margin-bottom: var(--size-4-2); font-size: 0.9em;">
                    基本的な投稿（ThreadManager.parseThread()の結果）
                </h4>
                <PostItem
                    post={generateBasicPost()}
                    index={0}
                    onHoverPostLink={fn()}
                    onLeavePostLink={fn()}
                    onJumpToPost={fn()}
                    onShowReplyTree={fn()}
                    onShowIdPosts={fn()}
                    onShowPostContextMenu={fn()}
                    onThreadLinkClick={fn()}
                />
            </div>

            <!-- アンカー付き投稿 -->
            <div style="margin-bottom: var(--size-4-6);">
                <h4 style="color: var(--text-normal); margin-bottom: var(--size-4-2); font-size: 0.9em;">
                    アンカー付き投稿（DefaultParser.parseThread()でアンカーが&lt;a&gt;タグに変換済み）
                </h4>
                <PostItem
                    post={generatePostWithAnchors()}
                    index={2}
                    onHoverPostLink={fn()}
                    onLeavePostLink={fn()}
                    onJumpToPost={fn()}
                    onShowReplyTree={fn()}
                    onShowIdPosts={fn()}
                    onShowPostContextMenu={fn()}
                    onThreadLinkClick={fn()}
                />
            </div>

            <!-- 画像付き投稿 -->
            <div style="margin-bottom: var(--size-4-6);">
                <h4 style="color: var(--text-normal); margin-bottom: var(--size-4-2); font-size: 0.9em;">
                    画像付き投稿（imageUrls配列とhasImage=trueの組み合わせ）
                </h4>
                <PostItem
                    post={generatePostWithImages()}
                    index={1}
                    onHoverPostLink={fn()}
                    onLeavePostLink={fn()}
                    onJumpToPost={fn()}
                    onShowReplyTree={fn()}
                    onShowIdPosts={fn()}
                    onShowPostContextMenu={fn()}
                    onThreadLinkClick={fn()}
                />
            </div>

            <div style="margin-top: var(--size-4-4); padding: var(--size-4-3); background-color: var(--background-secondary); border-radius: var(--radius-s);">
                <p style="color: var(--text-muted); font-size: 0.85em; margin: 0;">
                    注意: このテストでは、ThreadManagerのDefaultParser.parseThread()によって
                    処理された後のデータ構造を使用しています。実際の統合テストはE2Eテストで行ってください。
                </p>
            </div>
        </div>
    </CenterDecorator>
</Story>
