<!-- src/stories/livechat/LiveChatView.stories.svelte -->
<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import LiveChatView from "../../view/livechat/LiveChatView.svelte";
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
                content: `これは${i}番目の投稿です。ライブチャットのテストメッセージ。`,
                date: new Date(Date.now() - (count - i) * 1000 * 60),
                references: i > 1 ? [i - 1] : [],
                replies: [],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [i],
                imageUrls: [],
            });
        }
        return posts;
    };

    const { Story } = defineMeta({
        title: "LiveChat/LiveChatView",
        component: LiveChatView,
        tags: ["autodocs"],
        argTypes: {
            initialPosts: {
                control: "object",
                description: "初期表示する投稿の配列",
            },
            initialControlState: {
                control: "object",
                description: "初期の再生コントロール状態",
            },
            initialReloadInterval: {
                control: "number",
                description: "初期の自動更新間隔 (ms)",
            },
            onToggleAutoReload: {
                action: "onToggleAutoReload",
                description: "自動更新のオン/オフを切り替えるコールバック",
            },
            onIntervalChange: {
                action: "onIntervalChange",
                description:
                    "自動更新間隔が変更されたときに呼び出されるコールバック",
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

<script lang="ts">
    let interactivePosts: Post[] = generatePosts(20);
    let interactiveControlState = { isPlaying: true };
    let interactiveReloadInterval = 10000; // 10秒

    // 新しい投稿を追加するための模擬関数
    let postCounter = interactivePosts.length;
    function addMockPost() {
        postCounter++;
        const newPost: Post = {
            resNum: postCounter,
            authorName: "新しい名無しさん",
            mail: "",
            authorId: `NEW${(postCounter % 3).toString().padStart(2, "0")}`,
            content: `インタラクティブテストで追加された${postCounter}番目の投稿です！`,
            date: new Date(),
            references: [postCounter - 1],
            replies: [],
            hasImage: postCounter % 4 === 0,
            hasExternalLink: postCounter % 5 === 0,
            postIdCount: 1,
            siblingPostNumbers: [postCounter],
            imageUrls:
                postCounter % 4 === 0
                    ? [
                          `https://via.placeholder.com/40x40?text=New${postCounter}`,
                      ]
                    : [],
        };
        // 直接 `posts` ステートを更新する代わりに、addNewPost 関数を呼び出す
        // これはLiveChatViewのpublic APIをテストするためのものです
        // Storybookのコントロールでは直接変更できないため、ここではダミーのrefを使います
        // 実際のStorybookの実行時には、`<LiveChatView bind:this={liveChatViewRef} ... />` のようにbindする
        // 今回は `addNewPost` を直接 `Story` の引数に渡す形で模擬します
        // ただし、Storybookの `args` を直接変更することは推奨されないため、`Story` 内での状態管理を考慮します
        // 以下は概念的なもので、実際にはStorybookの`render`関数やカスタムフックを使うことが適切かもしれません。
        // 一旦、interactiveなStoryでは `addNewPost` を模擬的に呼び出すようにします。
        // ここでは、`args` の `initialPosts` が変更された際にUIが更新されるかを見る
        interactivePosts = [...interactivePosts, newPost];
    }
</script>

<!-- 基本的な表示 -->
<Story
    name="Default"
    args={{
        initialPosts: generatePosts(20),
        initialControlState: { isPlaying: true },
        initialReloadInterval: 10000,
        onToggleAutoReload: fn(),
        onIntervalChange: fn(),
    }}
/>

<!-- 多くの投稿と自動再生オフ -->
<Story
    name="Many Posts, Auto Reload Off"
    args={{
        initialPosts: generatePosts(150),
        initialControlState: { isPlaying: false },
        initialReloadInterval: 30000,
        onToggleAutoReload: fn(),
        onIntervalChange: fn(),
    }}
/>

<!-- 投稿がない場合 -->
<Story
    name="Empty"
    args={{
        initialPosts: [],
        initialControlState: { isPlaying: true },
        initialReloadInterval: 10000,
        onToggleAutoReload: fn(),
        onIntervalChange: fn(),
    }}
/>

<!-- インタラクティブなテスト -->
<Story
    name="Interactive"
    args={{
        initialPosts: interactivePosts,
        initialControlState: interactiveControlState,
        initialReloadInterval: interactiveReloadInterval,
        onToggleAutoReload: fn(),
        onIntervalChange: (interval: number) => {
            interactiveReloadInterval = interval;
            fn().call(null, interval); // Storybook action logger をトリガー
        },
    }}
>
    <div
        style="position: absolute; top: 10px; right: 10px; z-index: 100; background: var(--background-secondary); padding: 8px; border-radius: 4px; font-size: 12px;"
    >
        <button on:click={addMockPost} style="margin-right: 10px;">
            投稿を追加
        </button>
        <!-- このデバッグ表示はLiveChatViewの内部状態とは直接同期しません -->
        <p>isPlaying (story state): {interactiveControlState.isPlaying}</p>
        <p>Interval: {interactiveReloadInterval / 1000}s</p>
    </div>
    <LiveChatView
        initialPosts={interactivePosts}
        initialControlState={interactiveControlState}
        initialReloadInterval={interactiveReloadInterval}
        onToggleAutoReload={() => {
            // LiveChatViewの内部で状態が変更されたことを受けて、
            // このストーリー内のデバッグ表示用の状態を更新します。
            interactiveControlState.isPlaying =
                !interactiveControlState.isPlaying;
            fn()("Toggled auto-reload");
        }}
        onIntervalChange={(interval: number) => {
            interactiveReloadInterval = interval;
            fn().call(null, interval);
        }}
    />
</Story>
