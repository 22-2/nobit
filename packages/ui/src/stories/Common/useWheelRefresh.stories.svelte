<!-- E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\stories\common\useWheelRefresh.stories.svelte -->
<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import CenterDecorator from "../helpers/CenterDecorator.svelte";

    // テスト用ユーティリティ
    import { fn, expect, fireEvent, within, waitFor } from "storybook/test";

    import WheelRefreshTester from "../helpers/WheelRefreshTester.svelte";

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

        await step("Scroll more to trigger refresh function", async () => {
            scrollContainer.scrollTop = 0;
            // NOTE: WheelRefreshTester.svelte が `status` を表示するように変更されている前提
            for (let i = 0; i < 5; i++) {
                await fireEvent.wheel(scrollContainer, { deltaY: -100 });
            }
            await waitFor(() => {
                expect(args.onUpRefresh).toHaveBeenCalledTimes(1);
            });
            await waitFor(() => {
                expect(canvas.getByText("status: success")).toBeInTheDocument();
                expect(canvas.getByText("✅️")).toBeInTheDocument();
            });
        });

        await step("Should be blocked during success display", async () => {
            // success 中はホイールしても何も起こらない
            await fireEvent.wheel(scrollContainer, { deltaY: -100 });
            expect(canvas.queryByText("↑")).not.toBeInTheDocument();
            // 2回目のリフレッシュは呼ばれない
            expect(args.onUpRefresh).toHaveBeenCalledTimes(1);
        });

        await step(
            "Should return to idle status after success display",
            async () => {
                await waitFor(
                    () => {
                        expect(
                            canvas.getByText("status: idle")
                        ).toBeInTheDocument();
                    },
                    { timeout: 1000 } // SUCCESS_DISPLAY_DURATION + アルファ
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

        await step("Scroll more to trigger refresh function", async () => {
            for (let i = 0; i < 4; i++) {
                await fireEvent.wheel(scrollContainer, { deltaY: 100 });
            }
            await waitFor(() => {
                expect(args.onDownRefresh).toHaveBeenCalledTimes(1);
            });
            await waitFor(() => {
                expect(canvas.getByText("status: success")).toBeInTheDocument();
                expect(canvas.getByText("✅️")).toBeInTheDocument();
            });
        });

        await step("Should be blocked during success display", async () => {
            await fireEvent.wheel(scrollContainer, { deltaY: 100 });
            expect(canvas.queryByText("↓")).not.toBeInTheDocument();
            expect(canvas.queryByText("✅️")).toBeInTheDocument(); // まだ表示されている
            // 2回目のリフレッシュは呼ばれない
            expect(args.onDownRefresh).toHaveBeenCalledTimes(1);
        });

        await step(
            "Should return to idle status after success display",
            async () => {
                await waitFor(
                    () => {
                        expect(
                            canvas.getByText("status: idle")
                        ).toBeInTheDocument();
                    },
                    { timeout: 1000 } // SUCCESS_DISPLAY_DURATION + アルファ
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
            // 初期状態がidleであることを確認
            expect(canvas.getByText("status: idle")).toBeInTheDocument();
        });
    }}
>
    <WheelRefreshTester {...args} />
</Story>

<!-- リフレッシュ後のインジケータ表示をテストするストーリー -->
<Story
    name="SuccessIndicator"
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

        await step("Check success indicator appears", async () => {
            await waitFor(() => {
                expect(canvas.getByText("status: success")).toBeInTheDocument();
            });
            const checkmark = await canvas.findByText("✅️");
            expect(checkmark).toBeInTheDocument();
        });

        await step(
            "Check indicator disappears after delay and goes to idle",
            async () => {
                await waitFor(
                    () => {
                        expect(
                            canvas.getByText("status: idle")
                        ).toBeInTheDocument();
                    },
                    { timeout: 1000 }
                );
                expect(canvas.queryByText("✅️")).not.toBeInTheDocument();
            }
        );
    }}
>
    <WheelRefreshTester {...args} />
</Story>
