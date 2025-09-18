<!-- src/stories/WheelRefreshIntegration.stories.svelte -->
<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    // `fn` はモック関数、他はテスト用ユーティリティ
    import { fn, expect, fireEvent, within, waitFor } from "storybook/test";

    // 結合テストなので、テスト対象のヘルパーコンポーネントをインポートします
    import WheelRefreshTester from "./helpers/WheelRefreshTester.svelte";

    const { Story } = defineMeta({
        title: "Integration/WheelRefresh",
        component: WheelRefreshTester,
        tags: ["autodocs", "test"], // 'test'タグでplay functionが実行されます
        argTypes: {
            onUpRefresh: { action: "onUpRefresh" },
            onDownRefresh: { action: "onDownRefresh" },
        },
    });
</script>

<script>
    // Storybookから渡されるargsをそのまま受け取ります
    let { args } = $props();
</script>

<!-- Story 1: 上方向リフレッシュの結合テスト -->
<Story
    name="UpRefreshIntegration"
    args={{
        onUpRefresh: fn(),
        upThreshold: 5, // テストしやすいように閾値を設定
        isEnabled: true,
        initialScrollTop: 0, // 最初から一番上にスクロールした状態
    }}
    play={async ({ args, canvasElement, step }) => {
        const canvas = within(canvasElement);
        const scrollContainer = await canvas.findByTestId("scroll-container");

        await step("Scroll up at top shows progress indicator", async () => {
            // 1回目のホイールイベントを発火
            await fireEvent.wheel(scrollContainer, { deltaY: -100 });

            // インジケーターが表示されるのを待つ
            const indicator = await canvas.findByText("↑");
            expect(indicator).toBeInTheDocument();

            // プログレスバーの状態を確認 (1 / 5 = 20%)
            const progressBar = canvasElement.querySelector(".progress-bar");
            expect(progressBar).toHaveStyle("width: 20%");
        });

        await step("Continue scrolling up increases progress", async () => {
            // 2回目、3回目のホイールイベントを発火
            await fireEvent.wheel(scrollContainer, { deltaY: -100 });
            await fireEvent.wheel(scrollContainer, { deltaY: -100 });

            // プログレスバーの幅が更新されるのを待つ (3 / 5 = 60%)
            await waitFor(() => {
                const progressBar =
                    canvasElement.querySelector(".progress-bar");
                expect(progressBar).toHaveStyle("width: 60%");
            });
        });

        await step("Scrolling away from the edge resets progress", async () => {
            // 一旦下にスクロールして、状態がリセットされるか確認
            scrollContainer.scrollTop = 100;
            // 再度ホイールイベントを発火しても、最上部ではないので反応しない
            await fireEvent.wheel(scrollContainer, { deltaY: -100 });

            // インジケーターが消えていることを確認
            expect(canvas.queryByText("↑")).not.toBeInTheDocument();

            // テストのために再び最上部に戻る
            scrollContainer.scrollTop = 0;
        });

        await step(
            "Reaching threshold triggers refresh and shows post-refresh indicator", // テスト名を変更: "hides indicator" -> "shows post-refresh indicator"
            async () => {
                // 状態がリセットされているので、最初から5回ホイールイベントを発火
                for (let i = 0; i < 5; i++) {
                    await fireEvent.wheel(scrollContainer, { deltaY: -100 });
                }

                // onUpRefreshが1回呼ばれたことを確認
                await waitFor(() => {
                    expect(args.onUpRefresh).toHaveBeenCalledTimes(1);
                });

                // isRefreshing状態になり、✓ インジケーターが表示されることを確認
                await waitFor(() => {
                    expect(
                        canvas.getByTestId("state-refreshing")
                    ).toHaveTextContent("isRefreshing: true");
                    expect(
                        canvas.getByTestId("state-post-refresh")
                    ).toHaveTextContent("isShowingPostRefresh: true"); // isShowingPostRefresh が true になることを確認
                });
                const checkmarkIndicator = await canvas.findByText("✓"); // ✓ が表示されることを確認
                expect(checkmarkIndicator).toBeInTheDocument();
                expect(canvas.queryByText("↑")).not.toBeInTheDocument(); // ↑ は表示されない
            }
        );

        await step("Indicator is hidden during cooldown period", async () => {
            // isRefreshing完了後(1秒後)、isCoolingDownがtrueになるのを待つ
            await waitFor(
                () => {
                    expect(
                        canvas.getByTestId("state-cooldown")
                    ).toHaveTextContent("isCoolingDown: true");
                },
                { timeout: 1500 }
            );

            // post-refreshインジケーター (✓) が消えるのを待つ (INDICATOR_DISPLAY_DELAY: 500ms 後)
            await waitFor(
                () => {
                    expect(canvas.queryByText("✓")).not.toBeInTheDocument();
                    expect(
                        canvas.getByTestId("state-post-refresh")
                    ).toHaveTextContent("isShowingPostRefresh: false");
                },
                { timeout: 700 }
            ); // INDICATOR_DISPLAY_DELAY + margin

            // クールダウン中にホイールしてもインジケーターは表示されない
            await fireEvent.wheel(scrollContainer, { deltaY: -100 });
            expect(canvas.queryByText("↑")).not.toBeInTheDocument();
        });

        await step("Indicator works again after cooldown is over", async () => {
            // クールダウンが終わるのを待つ (合計2秒以上)
            await waitFor(
                () => {
                    expect(
                        canvas.getByTestId("state-cooldown")
                    ).toHaveTextContent("isCoolingDown: false");
                },
                { timeout: 1500 } // COOLDOWN_PERIOD + margin
            );

            // 再度ホイールするとインジケーターが表示される
            await fireEvent.wheel(scrollContainer, { deltaY: -100 });
            const indicator = await canvas.findByText("↑");
            expect(indicator).toBeInTheDocument();
            const progressBar = canvasElement.querySelector(".progress-bar");
            expect(progressBar).toHaveStyle("width: 20%");
        });
    }}
>
    <WheelRefreshTester {...args} />
</Story>

<!-- Story 2: 下方向リフレッシュの結合テスト -->
<Story
    name="DownRefreshIntegration"
    args={{
        onDownRefresh: fn(),
        downThreshold: 4,
        isEnabled: true,
        initialScrollTop: -1, // 最初から一番下にスクロールした状態
        statePosition: "bottom", // テスト用の状態表示を下に配置
    }}
    play={async ({ args, canvasElement, step }) => {
        const canvas = within(canvasElement);
        const scrollContainer = await canvas.findByTestId("scroll-container");

        // コンテナが一番下までスクロールされるのを待つ
        await waitFor(() => {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            // ほぼ一番下にあることを確認
            expect(scrollTop + clientHeight).toBeGreaterThanOrEqual(
                scrollHeight - 5
            );
        });

        await step(
            "Scroll down at bottom shows progress indicator",
            async () => {
                // 1回目のホイールイベントを発火
                await fireEvent.wheel(scrollContainer, { deltaY: 100 });

                // インジケーターが表示されるのを待つ
                const indicator = await canvas.findByText("↓");
                expect(indicator).toBeInTheDocument();

                // インジケーターが下部に表示されていることを確認
                expect(indicator.parentElement).toHaveClass("bottom");

                // プログレスバーの状態を確認 (1 / 4 = 25%)
                const progressBar = canvasElement.querySelector(
                    ".wheel-progress-indicator.bottom .progress-bar"
                );
                expect(progressBar).toHaveStyle("width: 25%");
            }
        );

        await step("Reaching threshold triggers refresh", async () => {
            // 閾値に達するまでホイールイベントを発火 (残り3回)
            for (let i = 0; i < 3; i++) {
                await fireEvent.wheel(scrollContainer, { deltaY: 100 });
            }

            // onDownRefreshが1回呼ばれたことを確認
            await waitFor(() => {
                expect(args.onDownRefresh).toHaveBeenCalledTimes(1);
            });

            // isRefreshing状態になり、✓ インジケーターが表示されることを確認
            await waitFor(() => {
                expect(
                    canvas.getByTestId("state-refreshing")
                ).toHaveTextContent("isRefreshing: true");
                expect(
                    canvas.getByTestId("state-post-refresh")
                ).toHaveTextContent("isShowingPostRefresh: true");
            });
            const checkmarkIndicator = await canvas.findByText("✓"); // ✓ が表示されることを確認
            expect(checkmarkIndicator).toBeInTheDocument();
            expect(canvas.queryByText("↓")).not.toBeInTheDocument(); // ↓ は表示されない
        });
    }}
>
    <WheelRefreshTester {...args} />
</Story>
