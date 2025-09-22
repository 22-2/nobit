<!-- E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\stories\thread\ThreadView.stories.svelte -->
<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import {
        userEvent,
        within,
        expect,
        fn,
        fireEvent,
        waitFor,
    } from "storybook/test";
    import ThreadView from "../../view/thread/ThreadView.svelte";
    import { createThreadDataStore } from "../../stores/threadDataStore.svelte";
    import type {
        Thread,
        Post,
        PostData,
        PostResult,
    } from "@nobit/libch/core/types";
    import type { BBSProvider } from "@nobit/libch/core/provider";

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
        provider: Partial<BBSProvider>,
        initialThread: Partial<Thread> = {}
    ) => {
        return createThreadDataStore({
            provider: provider as BBSProvider,
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
        component: ThreadView,
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
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // 投稿が非同期で表示されるのを待つ
        const firstPost = await canvas.findByText(
            /これは 1 番目の投稿です。/,
            {},
            { timeout: 2000 }
        );
        await expect(firstPost).toBeInTheDocument();
    }}
>
    {#snippet template({ store })}
        <ThreadView {store} />
    {/snippet}
</Story>

<!-- 初回データ読み込み中の状態 -->
<Story
    name="Loading"
    args={{
        store: createMockStore({
            getThread: fn((url: string) => new Promise(() => {})), // 解決しないPromise
            post: fn(),
        }),
    }}
>
    {#snippet template({ store })}
        <ThreadView {store} />
    {/snippet}
</Story>

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
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            await canvas.findByText(
                /エラー: ネットワークエラーが発生しました。/
            )
        ).toBeInTheDocument();
    }}
>
    {#snippet template({ store })}
        <ThreadView {store} />
    {/snippet}
</Story>

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
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // 初期データが表示されていることを確認
        await expect(
            await canvas.findByText(/これは 15 番目の投稿です。/)
        ).toBeInTheDocument();
    }}
>
    {#snippet template({ store })}
        <ThreadView {store} />
    {/snippet}
</Story>

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
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // `posts-list` は存在するが、中身が空であることを確認
        const postList = await canvas.findByRole("feed");
        await expect(postList).toBeInTheDocument();
        await expect(postList.children.length).toBe(1); // refresh-trigger-lineのみ
    }}
>
    {#snippet template({ store })}
        <ThreadView {store} />
    {/snippet}
</Story>

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
        const writeButton = await canvas.findByRole("button", {
            name: "Write a post",
        });
        await userEvent.click(writeButton);
        await expect(
            canvas.getByRole("textbox", { name: "Content" })
        ).toBeInTheDocument();
    }}
>
    {#snippet template({ store })}
        <ThreadView {store} />
    {/snippet}
</Story>

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
        const writeButton = await canvas.findByRole("button", {
            name: "Write a post",
        });
        await userEvent.click(writeButton);
        const contentBox = await canvas.findByRole("textbox", {
            name: "Content",
        });
        await userEvent.type(contentBox, "これはテスト投稿です。");
        const submitButton = await canvas.getByRole("button", { name: "Post" });
        await userEvent.click(submitButton);
        await expect(submitButton).toBeDisabled();
    }}
>
    {#snippet template({ store })}
        <ThreadView {store} />
    {/snippet}
</Story>

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
        const writeButton = await canvas.findByRole("button", {
            name: "Write a post",
        });
        await userEvent.click(writeButton);
        const contentBox = await canvas.findByRole("textbox", {
            name: "Content",
        });
        await userEvent.type(contentBox, "エラーになる投稿です。");
        const submitButton = await canvas.getByRole("button", { name: "Post" });
        await userEvent.click(submitButton);

        await expect(submitButton).not.toBeDisabled();
        await expect(contentBox).toBeInTheDocument();
        // 現在のUIでは投稿失敗時のエラーは画面に表示されないため、DOMのアサーションは行わない
    }}
>
    {#snippet template({ store })}
        <ThreadView {store} />
    {/snippet}
</Story>

<!-- ホイールリフレッシュのテスト（下方向） -->
<Story
    name="Wheel Refresh Interaction (Down)"
    args={{
        provider: {
            getThread: fn(async (url: string) => {
                await new Promise((r) => setTimeout(r, 500));
                return generateSampleThread(30); // スクロール可能にする
            }),
            post: fn(),
        },
    }}
    play={async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const scrollContainer = await canvas.findByRole("feed");

        // 投稿が非同期で表示されるのを待つ
        await canvas.findByText(
            /これは 1 番目の投稿です。/,
            {},
            { timeout: 2000 }
        );

        // コンテナを一番下までスクロール
        scrollContainer.scrollTop = scrollContainer.scrollHeight;

        // リフレッシュの閾値（デフォルトは7）までホイールイベントを発火
        for (let i = 0; i < 7; i++) {
            fireEvent.wheel(scrollContainer, { deltaY: 100 });
        }

        // store.loadThreadが呼ばれ、provider.getThreadが再度呼ばれることを確認
        await waitFor(() => {
            // argsからproviderを取得して検証
            // 初回ロードとリフレッシュで合計2回呼ばれる
            expect(args.provider.getThread).toHaveBeenCalledTimes(2);
        });

        // 成功インジケータが表示されるのを待つ
        await waitFor(
            async () => {
                await expect(canvas.getByText("✅️")).toBeInTheDocument();
            },
            { timeout: 2000 }
        );
    }}
>
    {#snippet template({ provider })}
        <!-- argsから渡されたproviderを使ってstoreを生成 -->
        {@const store = createMockStore(provider)}
        <ThreadView {store} />
    {/snippet}
</Story>
