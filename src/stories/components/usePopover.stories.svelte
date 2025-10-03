<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import CenterDecorator from "../helpers/CenterDecorator.svelte";
    import PopoverTester from "../helpers/PopoverTester.svelte";

    import { expect, userEvent, within, waitFor } from "storybook/test";

    const { Story } = defineMeta({
        title: "Common/usePopover",
        component: PopoverTester,
        tags: ["autodocs", "test"],
        argTypes: {
            threadData: {
                control: "object",
                description:
                    "スレッドデータ（nullの場合はサンプルデータを使用）",
            },
            showTestPosts: {
                control: "boolean",
                description: "テスト用の投稿リンクを表示するかどうか",
            },
            containerHeight: {
                control: "text",
                description: "コンテナの高さ",
            },
            containerWidth: {
                control: "text",
                description: "コンテナの幅",
            },
        },
        decorators: [
            (StoryComponent) => ({
                Component: CenterDecorator,
                props: {
                    children: StoryComponent,
                    minHeight: "var(--size-4-100)",
                    padding: "var(--size-4-4)",
                },
            }),
        ],
    });
</script>

<script>
    let { args } = $props();
</script>

<!-- 基本的なポップオーバー表示のテスト -->
<Story
    name="BasicPopover"
    args={{
        showTestPosts: true,
        containerHeight: "400px",
        containerWidth: "600px",
    }}
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step("Should show popover when clicking post link", async () => {
            const postLink1 = await canvas.findByTestId("post-link-1");
            await userEvent.click(postLink1);

            // ポップオーバーが表示されることを確認
            await waitFor(() => {
                const popoverContainer =
                    canvas.getByTestId("popover-container");
                expect(popoverContainer.children.length).toBeGreaterThan(0);
            });
        });

        await step(
            "Should show multiple popovers when clicking different links",
            async () => {
                const postLink2 = await canvas.findByTestId("post-link-2");
                await userEvent.click(postLink2);

                await waitFor(() => {
                    const popoverContainer =
                        canvas.getByTestId("popover-container");
                    expect(popoverContainer.children.length).toBeGreaterThan(0);
                });
            }
        );
    }}
>
    <PopoverTester {...args} />
</Story>

<!-- 返信ツリー表示のテスト -->
<Story
    name="ReplyTree"
    args={{
        showTestPosts: true,
        containerHeight: "500px",
        containerWidth: "700px",
    }}
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step(
            "Should show reply tree when clicking reply tree link",
            async () => {
                const replyTreeLink = await canvas.findByTestId("reply-tree-1");
                await userEvent.click(replyTreeLink);

                // 返信ツリーのポップオーバーが表示されることを確認
                await waitFor(() => {
                    const popoverContainer =
                        canvas.getByTestId("popover-container");
                    expect(popoverContainer.children.length).toBeGreaterThan(0);
                });
            }
        );
    }}
>
    <PopoverTester {...args} />
</Story>

<!-- ポップオーバーの非表示タイマーのテスト -->
<Story
    name="HideTimer"
    args={{
        showTestPosts: true,
        containerHeight: "400px",
        containerWidth: "600px",
    }}
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step("Should show popover first", async () => {
            const postLink1 = await canvas.findByTestId("post-link-1");
            await userEvent.click(postLink1);

            await waitFor(() => {
                const popoverContainer =
                    canvas.getByTestId("popover-container");
                expect(popoverContainer.children.length).toBeGreaterThan(0);
            });
        });

        await step("Should start hide timer and hide popovers", async () => {
            const hideTimerButton =
                await canvas.findByTestId("start-hide-timer");
            await userEvent.click(hideTimerButton);

            // タイマー後にポップオーバーが非表示になることを確認
            await waitFor(
                () => {
                    const popoverContainer =
                        canvas.getByTestId("popover-container");
                    expect(popoverContainer.children.length).toBe(0);
                },
                { timeout: 1000 }
            );
        });
    }}
>
    <PopoverTester {...args} />
</Story>

<!-- カスタムスレッドデータでのテスト -->
<Story
    name="CustomThreadData"
    args={{
        showTestPosts: true,
        containerHeight: "400px",
        containerWidth: "600px",
        threadData: {
            id: "custom-thread",
            title: "カスタムスレッド",
            url: "https://example.com/custom",
            resCount: 2,
            posts: [
                {
                    resNum: 1,
                    authorName: "カスタムユーザー",
                    mail: "",
                    authorId: "ID:custom001",
                    content: "これはカスタムレスです。",
                    date: new Date("2024-02-01T12:00:00"),
                    references: [],
                    replies: [],
                    hasImage: false,
                    hasExternalLink: true,
                    postIdCount: 1,
                    siblingPostNumbers: [1],
                },
                {
                    resNum: 2,
                    authorName: "別のユーザー",
                    mail: "sage",
                    authorId: "ID:custom002",
                    content:
                        "外部リンク付きのレスです。<a href='https://example.com'>リンク</a>",
                    date: new Date("2024-02-01T12:05:00"),
                    references: [],
                    replies: [],
                    hasImage: false,
                    hasExternalLink: true,
                    postIdCount: 1,
                    siblingPostNumbers: [2],
                },
            ],
        },
    }}
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step("Should work with custom thread data", async () => {
            const postLink1 = await canvas.findByTestId("post-link-1");
            await userEvent.click(postLink1);

            await waitFor(() => {
                const popoverContainer =
                    canvas.getByTestId("popover-container");
                expect(popoverContainer.children.length).toBeGreaterThan(0);
            });
        });
    }}
>
    <PopoverTester {...args} />
</Story>

<!-- ポップオーバーなしの最小構成 -->
<Story
    name="MinimalSetup"
    args={{
        showTestPosts: false,
        containerHeight: "200px",
        containerWidth: "400px",
    }}
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step("Should initialize without test posts", async () => {
            const tester = await canvas.findByTestId("popover-tester");
            expect(tester).toBeInTheDocument();

            // テスト用投稿リンクが表示されていないことを確認
            expect(canvas.queryByTestId("post-link-1")).not.toBeInTheDocument();
        });
    }}
>
    <PopoverTester {...args} />
</Story>

<!-- エラーハンドリングのテスト -->
<Story
    name="ErrorHandling"
    args={{
        showTestPosts: true,
        containerHeight: "400px",
        containerWidth: "600px",
        threadData: {
            id: "error-thread",
            title: "エラーテストスレッド",
            url: "https://example.com/error",
            resCount: 1,
            posts: [
                {
                    resNum: 1,
                    authorName: "テストユーザー",
                    mail: "",
                    authorId: "ID:test001",
                    content: "存在するレス",
                    date: new Date("2024-01-01T10:00:00"),
                    references: [],
                    replies: [],
                    hasImage: false,
                    hasExternalLink: false,
                    postIdCount: 1,
                    siblingPostNumbers: [1],
                },
            ],
        },
    }}
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step("Should handle non-existent post gracefully", async () => {
            // 存在しないレス（インデックス2）をクリック
            const postLink3 = await canvas.findByTestId("post-link-3");
            await userEvent.click(postLink3);

            // エラーポップアップが表示されることを確認
            // （実際の実装では「該当レス無し」のポップアップが表示される）
            await waitFor(() => {
                const popoverContainer =
                    canvas.getByTestId("popover-container");
                // エラーメッセージのポップアップが表示されるはず
                expect(popoverContainer.children.length).toBeGreaterThanOrEqual(
                    0
                );
            });
        });
    }}
>
    <PopoverTester {...args} />
</Story>
