<!-- src/stories/livechat/ChatPostList.stories.svelte -->
<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import ChatPostList from "../../view/livechat/ChatPostList.svelte";
    import CenterDecorator from "../helpers/CenterDecorator.svelte";
    import type { Post } from "../../types";
    import { fn } from "storybook/test";

    const generatePosts = (count: number): Post[] => {
        const posts: Post[] = [];
        for (let i = 1; i <= count; i++) {
            posts.push({
                resNum: i,
                authorName: "名無しさん",
                mail: "",
                authorId: `ID${(i % 5).toString().padStart(2, "0")}`,
                content: `これは${i}番目の投稿です。ライブチャットのテストメッセージ。<a href="https://example.com" target="_blank">リンク</a>や<img src="https://localhost/50x50?text=Img${i}" alt="sample image" />も含まれます。`,
                date: new Date(Date.now() - (count - i) * 1000 * 60), // 過去の投稿をシミュレート
                references: i > 1 ? [i - 1] : [],
                replies: [],
                hasImage: i % 3 === 0,
                hasExternalLink: i % 2 === 0,
                postIdCount: 1,
                siblingPostNumbers: [i],
                imageUrls:
                    i % 3 === 0 ? [`https://localhost/50x50?text=Img${i}`] : [],
            });
        }
        return posts;
    };

    const { Story } = defineMeta({
        title: "LiveChat/ChatPostList",
        component: ChatPostList,
        tags: ["autodocs"],
        argTypes: {
            posts: {
                control: "object",
                description: "表示する投稿の配列",
            },
            userHasScrolledUp: {
                control: "boolean",
                description: "ユーザーが上にスクロールしたかどうかの状態",
            },
            onUserHasScrolledUpChange: {
                action: "onUserHasScrolledUpChange",
                description:
                    "userHasScrolledUpの状態が変更されたときに呼び出されるコールバック",
            },
        },
        decorators: [
            (StoryComponent) => ({
                Component: CenterDecorator,
                props: {
                    children: StoryComponent,
                    padding: "0",
                    style: "width: 100%; height: 500px; border: 1px solid var(--background-modifier-border);",
                },
            }),
        ],
    });
</script>

<!-- 基本的な表示 -->
<Story
    name="Default"
    args={{
        posts: generatePosts(20),
        userHasScrolledUp: false,
        onUserHasScrolledUpChange: fn(),
    }}
/>

<!-- 多くの投稿がある場合 (スクロール可能) -->
<Story
    name="Many Posts"
    args={{
        posts: generatePosts(150), // MAX_POSTS_TO_DISPLAY (100) を超える
        userHasScrolledUp: false,
        onUserHasScrolledUpChange: fn(),
    }}
/>

<!-- ユーザーがスクロールアップしている状態 -->
<Story
    name="User Scrolled Up"
    args={{
        posts: generatePosts(50),
        userHasScrolledUp: true,
        onUserHasScrolledUpChange: fn(),
    }}
/>

<!-- 投稿がない場合 -->
<Story
    name="Empty"
    args={{
        posts: [],
        userHasScrolledUp: false,
        onUserHasScrolledUpChange: fn(),
    }}
/>

<!-- 長い投稿を含む場合 -->
<Story
    name="Long Post"
    args={{
        posts: [
            ...generatePosts(5),
            {
                resNum: 6,
                authorName: "長文投稿者",
                mail: "",
                authorId: "LONG01",
                content: `これは非常に長い投稿の例です。
複数の段落や改行が含まれています。
この投稿の目的は、コンポーネントが長いコンテンツをどのように扱うかを確認することです。
ライブチャットのようなリアルタイム性の高い表示では、テキストの折り返しやスクロールの挙動が重要になります。
<a href="https://longexample.com/very/long/url/that/might/break/layout/if/not/handled/correctly" target="_blank">非常に長いURLの例</a>。
<img src="https://localhost/200x100?text=WideImg" alt="wide image" />
`,
                date: new Date(),
                references: [1],
                replies: [],
                hasImage: true,
                hasExternalLink: true,
                postIdCount: 1,
                siblingPostNumbers: [6],
                imageUrls: ["https://localhost/200x100?text=WideImg"],
            },
            ...generatePosts(5).map((p) => ({ ...p, resNum: p.resNum + 6 })),
        ],
        userHasScrolledUp: false,
        onUserHasScrolledUpChange: fn(),
    }}
/>

<!-- 画像のみの投稿 -->
<Story
    name="Image Only Post"
    args={{
        posts: [
            ...generatePosts(5),
            {
                resNum: 6,
                authorName: "画像太郎",
                mail: "",
                authorId: "IMGTARO",
                content: `<img src="https://localhost/120x120?text=BigImage" alt="big image" />`,
                date: new Date(),
                references: [],
                replies: [],
                hasImage: true,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [6],
                imageUrls: ["https://localhost/120x120?text=BigImage"],
            },
            ...generatePosts(5).map((p) => ({ ...p, resNum: p.resNum + 6 })),
        ],
        userHasScrolledUp: false,
        onUserHasScrolledUpChange: fn(),
    }}
/>
