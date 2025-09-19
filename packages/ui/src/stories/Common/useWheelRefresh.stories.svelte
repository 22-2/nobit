<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import CenterDecorator from "./helpers/CenterDecorator.svelte";

    // `fn` はモック関数、他はテスト用ユーティリティ
    import {
        fn,
        expect,
        userEvent,
        fireEvent,
        within,
        waitFor,
    } from "storybook/test";

    import WheelRefreshTester from "./helpers/WheelRefreshTester.svelte";

    const { Story } = defineMeta({
        title: "Common/useWheelRefresh",
        component: WheelRefreshTester,
        tags: ["autodocs", "test"],
        argTypes: {
            isEnabled: { control: "boolean" },
            onUpRefresh: { action: "onUpRefresh" },
            onDownRefresh: { action: "onDownRefresh" },
            upThreshold: { control: "number" },
            downThreshold: { control: "number" },
            // statePosition を Controls パネルで操作できるように追加
            statePosition: {
                control: "select",
                options: ["top", "bottom"],
                description: "テスト用の状態表示エリアの位置",
            },
        },
        // CenterDecoratorを使用してテストコンポーネントを配置
        decorators: [
            (StoryComponent) => ({
                Component: CenterDecorator,
                props: {
                    children: StoryComponent,
                    minHeight: "var(--size-4-100)" /* 400px相当 */,
                    padding: "var(--size-4-4)" /* 16px */,
                },
            }),
        ],
    });
</script>

<script>
    // Storybookから渡されるargsをそのまま受け取るだけ
    let { args } = $props();
</script>

<!--
  デフォルトのストーリー。上方向のリフレッシュをテストします。
-->
<Story
    name="UpRefresh"
    args={{
        onUpRefresh: fn(),
        onDownRefresh: undefined, // 下方向のリフレッシュを無効化
        upThreshold: 5,
        isEnabled: true,
    }}
    play={async ({ args, canvasElement, step }) => {
        const canvas = within(canvasElement);
        const scrollContainer = await canvas.findByTestId("scroll-container");

        await step("Scroll up at top to show progress indicator", async () => {
            scrollContainer.scrollTop = 0;
            await fireEvent.wheel(scrollContainer, { deltaY: -100 });
            await waitFor(() => {
                expect(canvas.getByText("Count: 1")).toBeInTheDocument();
            });
            const indicator = await canvas.findByText("↑");
            expect(indicator).toBeInTheDocument();
            await fireEvent.wheel(scrollContainer, { deltaY: -100 });
            await fireEvent.wheel(scrollContainer, { deltaY: -100 });
            await waitFor(() => {
                expect(canvas.getByText("Count: 3")).toBeInTheDocument();
            });
            const progressBar = canvasElement.querySelector(".progress-bar");
            expect(progressBar.style.width).toBe("60%");
        });

        await step("Scroll more to trigger refresh function", async () => {
            await fireEvent.wheel(scrollContainer, { deltaY: -100 });
            await fireEvent.wheel(scrollContainer, { deltaY: -100 });
            await waitFor(() => {
                expect(args.onUpRefresh).toHaveBeenCalledTimes(1);
            });
            await waitFor(() => {
                expect(
                    canvas.getByText("isRefreshing: true")
                ).toBeInTheDocument();
                expect(canvas.queryByText("↑")).not.toBeInTheDocument();
            });
        });

        await step("Should show post-refresh indicator", async () => {
            expect(args.onUpRefresh).toHaveBeenCalledTimes(1);
            await waitFor(() => {
                expect(
                    canvas.getByText("isShowingPostRefresh: true")
                ).toBeInTheDocument();
            });
            // リフレッシュ後のチェックマークインジケータが表示されることを確認
            const checkmark = await canvas.findByText("✓");
            expect(checkmark).toBeInTheDocument();
        });

        await step("Should be in cooldown period", async () => {
            await waitFor(() => {
                expect(
                    canvas.getByText("isCoolingDown: true")
                ).toBeInTheDocument();
            });
            await fireEvent.wheel(scrollContainer, { deltaY: -100 });
            expect(canvas.queryByText("↑")).not.toBeInTheDocument();
        });

        await step(
            "Post-refresh indicator should disappear after delay",
            async () => {
                await waitFor(
                    () => {
                        expect(
                            canvas.getByText("isShowingPostRefresh: false")
                        ).toBeInTheDocument();
                    },
                    { timeout: 1000 }
                );
            }
        );
    }}
>
    <WheelRefreshTester {...args} />
</Story>

<!-- 下方向のリフレッシュをテストするストーリー -->
<Story
    name="DownRefresh"
    args={{
        onDownRefresh: fn(),
        onUpRefresh: undefined, // 上方向のリフレッシュを無効化
        downThreshold: 4,
        isEnabled: true,
        initialScrollTop: -1,
        // ★★★ ここがポイント ★★★
        // 状態表示を下に配置するように指定
        statePosition: "bottom",
    }}
    play={async ({ args, canvasElement, step }) => {
        const canvas = within(canvasElement);
        const scrollContainer = await canvas.findByTestId("scroll-container");

        await waitFor(() => {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            expect(scrollTop + clientHeight).toBeGreaterThanOrEqual(
                scrollHeight
            );
        });

        await step(
            "Scroll down at bottom to show progress indicator",
            async () => {
                await fireEvent.wheel(scrollContainer, { deltaY: 100 });
                await waitFor(() => {
                    expect(canvas.getByText("Count: 1")).toBeInTheDocument();
                });
                const indicator = await canvas.findByText("↓");
                expect(indicator).toBeInTheDocument();
                await fireEvent.wheel(scrollContainer, { deltaY: 100 });
                await fireEvent.wheel(scrollContainer, { deltaY: 100 });
                await waitFor(() => {
                    expect(canvas.getByText("Count: 3")).toBeInTheDocument();
                });
                const progressBar =
                    canvasElement.querySelector(".progress-bar");
                expect(progressBar.style.width).toBe("75%");
            }
        );

        await step("Scroll more to trigger refresh function", async () => {
            await fireEvent.wheel(scrollContainer, { deltaY: 100 });
            await waitFor(() => {
                expect(args.onDownRefresh).toHaveBeenCalledTimes(1);
            });
            await waitFor(() => {
                expect(
                    canvas.getByText("isRefreshing: true")
                ).toBeInTheDocument();
                expect(canvas.queryByText("↓")).not.toBeInTheDocument();
            });
        });

        await step("Should show post-refresh indicator", async () => {
            expect(args.onDownRefresh).toHaveBeenCalledTimes(1);
            await waitFor(() => {
                expect(
                    canvas.getByText("isShowingPostRefresh: true")
                ).toBeInTheDocument();
            });
            // リフレッシュ後のチェックマークインジケータが表示されることを確認
            const checkmark = await canvas.findByText("✓");
            expect(checkmark).toBeInTheDocument();
        });

        await step("Should be in cooldown period", async () => {
            await waitFor(() => {
                expect(
                    canvas.getByText("isCoolingDown: true")
                ).toBeInTheDocument();
            });
            await fireEvent.wheel(scrollContainer, { deltaY: 100 });
            expect(canvas.queryByText("↓")).not.toBeInTheDocument();
        });

        await step(
            "Post-refresh indicator should disappear after delay",
            async () => {
                await waitFor(
                    () => {
                        expect(
                            canvas.getByText("isShowingPostRefresh: false")
                        ).toBeInTheDocument();
                    },
                    { timeout: 1000 }
                );
            }
        );
    }}
>
    <WheelRefreshTester {...args} />
</Story>

<!-- 無効化状態をテストするストーリー -->
<Story
    name="Disabled"
    args={{
        onUpRefresh: fn(),
        upThreshold: 5,
        isEnabled: false,
    }}
    play={async ({ args, canvasElement, step }) => {
        const canvas = within(canvasElement);
        const scrollContainer = await canvas.findByTestId("scroll-container");

        await step("Should not trigger refresh when disabled", async () => {
            scrollContainer.scrollTop = 0;
            for (let i = 0; i < 10; i++) {
                await fireEvent.wheel(scrollContainer, { deltaY: -100 });
            }
            expect(canvas.queryByText("↑")).not.toBeInTheDocument();
            expect(args.onUpRefresh).not.toHaveBeenCalled();
        });
    }}
>
    <WheelRefreshTester {...args} />
</Story>

<!-- リフレッシュ後のインジケータ表示をテストするストーリー -->
<Story
    name="PostRefreshIndicator"
    args={{
        onUpRefresh: fn(),
        upThreshold: 3,
        isEnabled: true,
    }}
    play={async ({ args, canvasElement, step }) => {
        const canvas = within(canvasElement);
        const scrollContainer = await canvas.findByTestId("scroll-container");

        await step("Trigger refresh quickly", async () => {
            scrollContainer.scrollTop = 0;
            for (let i = 0; i < 3; i++) {
                await fireEvent.wheel(scrollContainer, { deltaY: -100 });
            }
            await waitFor(() => {
                expect(args.onUpRefresh).toHaveBeenCalledTimes(1);
            });
        });

        await step("Check post-refresh indicator appears", async () => {
            await waitFor(() => {
                expect(
                    canvas.getByText("isShowingPostRefresh: true")
                ).toBeInTheDocument();
            });
            const checkmark = await canvas.findByText("✓");
            expect(checkmark).toBeInTheDocument();
        });

        await step("Check indicator disappears after delay", async () => {
            await waitFor(
                () => {
                    expect(
                        canvas.getByText("isShowingPostRefresh: false")
                    ).toBeInTheDocument();
                },
                { timeout: 1000 }
            );
            expect(canvas.queryByText("✓")).not.toBeInTheDocument();
        });
    }}
>
    <WheelRefreshTester {...args} />
</Story>
