<!-- E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\stories\thread\ThreadView.stories.svelte -->
<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import { userEvent, within, expect, fn } from "storybook/test";
    import ThreadView from "../../view/thread/ThreadView.svelte";
    import { createThreadDataStore } from "../../stores/threadDataStore.svelte.ts";
    import type {
        Thread,
        Post,
        PostData,
        PostResult,
    } from "@nobit/libch/core/types";
    import type { BbsProvider } from "@nobit/libch/provider";

    // --- モックデータとヘルパー関数 ---

    /** 単一のPostオブジェクトを生成 */
    const generatePost = (
        resNum: number,
        content: string,
        references: number[] = [],
        replies: number[] = [],
        imageUrls: string[] = []
    ): Post => ({
        resNum,
        content,
        references,
        replies,
        imageUrls,
        authorName: `名無しさん`,
        mail: resNum % 10 === 0 ? "sage" : "",
        authorId: `ID:test${String(resNum % 7).padStart(3, "0")}`,
        date: new Date(Date.now() - (1000 - resNum) * 60000), // 現在から遡る
        hasImage: imageUrls.length > 0,
        hasExternalLink: content.includes("http"),
        postIdCount: 1,
        siblingPostNumbers: [resNum],
    });

    /** サンプルのスレッドデータを生成 */
    const generateSampleThread = (postCount = 20): Thread => ({
        title: "【Storybook】サンプルスレッド【テスト】",
        url: "https://example.com/test/read.cgi/board/1234567890/",
        posts: Array.from({ length: postCount }, (_, i) => {
            const resNum = i + 1;
            const refs =
                resNum > 1
                    ? [Math.floor(Math.random() * (resNum - 1)) + 1]
                    : [];
            return generatePost(
                resNum,
                `${refs.map((r) => `>>${r}`).join(" ")} これは ${resNum} 番目の投稿です。`,
                refs
            );
        }),
    });

    /** モックのロガー */
    const mockLogger = {
        info: fn(),
        warn: fn(),
        error: fn(),
    };

    /** 指定したプロバイダーでモックストアを作成 */
    const createMockStore = (
        provider: Partial<BbsProvider>,
        initialThread: Partial<Thread> = {}
    ) => {
        return createThreadDataStore({
            provider: provider as BbsProvider,
            logger: mockLogger,
            initialThread: {
                url: "https://example.com/test/read.cgi/board/1234567890/",
                title: "Initial Title",
                ...initialThread,
            },
        });
    };

    // --- Storybookのメタ情報 ---

    const { Story } = defineMeta({
        title: "Thread/ThreadView",
        component: ThreadView, // ここでレンダリングするコンポーネントを指定
        tags: ["autodocs"],
        parameters: {
            layout: "fullscreen",
        },
    });
</script>

<!-- 正常に読み込み、スレッドが表示されるデフォルトの状態 -->
<Story
    name="Default"
    args={{
        store: createMockStore({
            getThread: fn(async (url: string) => {
                await new Promise((r) => setTimeout(r, 500));
                return generateSampleThread(50);
            }),
            post: fn(),
        }),
    }}
/>

<!-- 初回データ読み込み中の状態 -->
<Story
    name="Loading"
    args={{
        store: createMockStore({
            getThread: fn((url: string) => new Promise(() => {})), // 解決しないPromise
            post: fn(),
        }),
    }}
/>

<!-- データ読み込みに失敗した状態 -->
<Story
    name="Error"
    args={{
        store: createMockStore({
            getThread: fn(async (url: string) => {
                await new Promise((r) => setTimeout(r, 500));
                throw new Error("ネットワークエラーが発生しました。");
            }),
            post: fn(),
        }),
    }}
/>

<!-- データ表示中に再読み込みしている状態 -->
<Story
    name="Refreshing"
    args={{
        store: createMockStore(
            {
                getThread: fn((url: string) => new Promise(() => {})), // 再読み込みが終わらない
                post: fn(),
            },
            generateSampleThread(15)
        ),
    }}
/>

<!-- ポストが一つもない空のスレッドの状態 -->
<Story
    name="EmptyThread"
    args={{
        store: createMockStore({
            getThread: fn(async (url: string) => {
                await new Promise((r) => setTimeout(r, 500));
                const thread = generateSampleThread(0);
                return { ...thread, posts: [] };
            }),
            post: fn(),
        }),
    }}
/>

<!-- ツールバーから投稿フォームを開いた状態 (インタラクションテスト) -->
<Story
    name="WithWriteForm"
    args={{
        store: createMockStore({
            getThread: fn(async (url: string) => generateSampleThread(5)),
            post: fn(async (url: string, data: PostData) => {
                await new Promise((r) => setTimeout(r, 1000));
                return {
                    kind: "success",
                    message: "書き込みました。",
                } as PostResult;
            }),
        }),
    }}
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const writeButton = await canvas.getByRole("button", {
            name: "Write a post",
        });
        await userEvent.click(writeButton);
        await expect(
            canvas.getByRole("textbox", { name: "Content" })
        ).toBeInTheDocument();
    }}
/>

<!-- 投稿処理中の状態 (インタラクションテスト) -->
<Story
    name="Submitting"
    args={{
        store: createMockStore({
            getThread: fn(async (url: string) => generateSampleThread(5)),
            post: fn((url: string, data: PostData) => new Promise(() => {})), // 解決しない
        }),
    }}
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // フォームを開く
        const writeButton = await canvas.getByRole("button", {
            name: "Write a post",
        });
        await userEvent.click(writeButton);
        // 入力
        const contentBox = await canvas.getByRole("textbox", {
            name: "Content",
        });
        await userEvent.type(contentBox, "これはテスト投稿です。");
        // 投稿ボタンをクリック
        const submitButton = await canvas.getByRole("button", { name: "Post" });
        await userEvent.click(submitButton);
        // 投稿中状態（無効化）を確認
        await expect(submitButton).toBeDisabled();
    }}
/>

<!-- 投稿に失敗した状態 (インタラクションテスト) -->
<Story
    name="PostError"
    args={{
        store: createMockStore({
            getThread: fn(async (url: string) => generateSampleThread(5)),
            post: fn(async (url: string, data: PostData) => {
                await new Promise((r) => setTimeout(r, 500));
                return {
                    kind: "error",
                    message: "書き込みが規制されています。",
                } as PostResult;
            }),
        }),
    }}
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const writeButton = await canvas.getByRole("button", {
            name: "Write a post",
        });
        await userEvent.click(writeButton);
        const contentBox = await canvas.getByRole("textbox", {
            name: "Content",
        });
        await userEvent.type(contentBox, "エラーになる投稿です。");
        const submitButton = await canvas.getByRole("button", { name: "Post" });
        await userEvent.click(submitButton);

        // エラー後、ボタンが再度有効になるのを待つ
        await expect(submitButton).not.toBeDisabled();
        // フォームが閉じずにまだ表示されていることを確認
        await expect(contentBox).toBeInTheDocument();

        // エラーメッセージはstoreで管理され、ThreadViewの内部で表示される
        // ここでは、特定のUI要素としてエラーメッセージを探す
        // 例: <p>エラー: {store.viewState.error}</p>
        await expect(
            await canvas.findByText(/エラー: 書き込みが規制されています。/)
        ).toBeInTheDocument();
    }}
/>
