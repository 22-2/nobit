<!-- E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\stories\board\ThreadListTable.integration.stories.svelte -->
<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import ThreadListTable from "../../view/board/ThreadListTable.svelte";
    import CenterDecorator from "../helpers/CenterDecorator.svelte";
    import {
        fn,
        userEvent,
        within,
        expect,
        waitFor,
        fireEvent,
    } from "storybook/test";
    import { sleep } from "../helpers/utils";

    // サンプルデータの生成（ソート結果が明確になるよう resCount を調整）
    const generateSampleThreads = (count = 20) => {
        const titles = [
            "【雑談】今日の出来事について語ろう",
            "プログラミング初心者質問スレ",
            "【速報】新しいフレームワークがリリース",
            "デバッグで困ったときの対処法",
            "コードレビューのコツを教えて",
        ];

        return Array.from({ length: count }, (_, i) => ({
            id: (Date.now() / 1000 - i * 3600).toString(),
            title: titles[i % titles.length] + ` (${i + 1})`,
            resCount: (count - i) * 10, // 例: 5件なら 50, 40, 30, 20, 10
        }));
    };

    const defaultVisibleColumns = {
        index: true,
        title: true,
        resCount: true,
        ikioi: true,
    };

    const { Story } = defineMeta({
        title: "Board/ThreadListTable (Integration)",
        component: ThreadListTable,
        tags: ["autodocs", "test"], // `test` タグを追加
        argTypes: {
            threads: { control: false },
            visibleColumns: { control: "object" },
            initialSortState: { control: "object" },
            isLoading: { control: "boolean" },
            onSortChange: { action: "onSortChange" },
            onRefresh: { action: "onRefresh" },
            openThread: { action: "openThread" },
            onContextMenu: { action: "onContextMenu" },
            openHeaderContextMenu: { action: "openHeaderContextMenu" },
        },
        decorators: [
            (StoryComponent) => ({
                Component: CenterDecorator,
                props: {
                    children: StoryComponent,
                    padding: "var(--size-4-4)" /* 16px */,
                    minHeight: "500px",
                },
            }),
        ],
    });
</script>

<script>
    let isLoadingForWheelTest = $state(false);
    const onRefreshAction = fn();

    async function handleRefreshForWheelTest() {
        onRefreshAction();
        isLoadingForWheelTest = true;
        await sleep(1000); // ローディング状態を1秒間シミュレート（ディレイ）
        isLoadingForWheelTest = false;
    }
</script>

<!-- 1. ソート機能のインタラクションテスト -->
<Story
    name="Sorting Interaction"
    args={{
        threads: generateSampleThreads(5),
        visibleColumns: defaultVisibleColumns,
        initialSortState: { sortKey: "index", sortDirection: "asc" },
        isLoading: false,
        onSortChange: fn(),
        onRefresh: fn(),
        openThread: fn(),
        onContextMenu: fn(),
        openHeaderContextMenu: fn(),
    }}
    play={async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        // --- 初期状態の確認 (indexでソート) ---
        const initialRows = await canvas.findAllByRole("row");
        expect(initialRows[1]).toHaveTextContent(
            "【雑談】今日の出来事について語ろう (1)"
        );
        expect(initialRows[2]).toHaveTextContent(
            "プログラミング初心者質問スレ (2)"
        );

        // --- ヘッダー「レス数」をクリックして降順ソート ---
        const resCountHeader = await canvas.findByRole("columnheader", {
            name: /レス数/i,
        });
        await userEvent.click(resCountHeader);

        await waitFor(() => {
            expect(args.onSortChange).toHaveBeenCalledWith({
                sortKey: "resCount",
                sortDirection: "desc",
            });
        });

        // 描画が更新され、レス数の多い順になっていることを確認
        let sortedRows = await canvas.findAllByRole("row");
        expect(sortedRows[1]).toHaveTextContent("50");
        expect(sortedRows[2]).toHaveTextContent("40");

        // --- 再度「レス数」をクリックして昇順ソート ---
        await userEvent.click(resCountHeader);
        await waitFor(() => {
            expect(args.onSortChange).toHaveBeenCalledWith({
                sortKey: "resCount",
                sortDirection: "asc",
            });
        });

        // 描画が更新され、レス数の少ない順になっていることを確認
        sortedRows = await canvas.findAllByRole("row");
        expect(sortedRows[1]).toHaveTextContent("10");
        expect(sortedRows[2]).toHaveTextContent("20");
    }}
/>

<!-- 2. 行のクリック・右クリック操作のテスト -->
<Story
    name="Row Interaction"
    args={{
        threads: generateSampleThreads(3),
        visibleColumns: defaultVisibleColumns,
        initialSortState: { sortKey: "index", sortDirection: "asc" },
        isLoading: false,
        onSortChange: fn(),
        onRefresh: fn(),
        openThread: fn(),
        onContextMenu: fn(),
        openHeaderContextMenu: fn(),
    }}
    play={async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        // 2番目のデータ行を取得 (index: 2)
        const secondDataRow = await canvas.findByRole("row", {
            name: /プログラミング初心者質問スレ/,
        });

        // --- 左クリックで openThread が呼ばれるか ---
        await userEvent.click(secondDataRow);
        expect(args.openThread).toHaveBeenCalledTimes(1);
        expect(args.openThread).toHaveBeenCalledWith(
            expect.objectContaining({ index: 2, resCount: 20 }),
            expect.any(Object)
        );

        // --- 右クリックで onContextMenu が呼ばれるか ---
        await userEvent.pointer({
            keys: "[MouseRight]",
            target: secondDataRow,
        });
        expect(args.onContextMenu).toHaveBeenCalledTimes(1);
        expect(args.onContextMenu).toHaveBeenCalledWith(
            expect.objectContaining({ index: 2, resCount: 20 }),
            expect.any(Object)
        );

        // --- ヘッダーの右クリック ---
        const header = await canvas.findByRole("rowheader");
        await userEvent.pointer({ keys: "[MouseRight]", target: header });
        expect(args.openHeaderContextMenu).toHaveBeenCalledTimes(1);
    }}
/>

<!-- 3. ローディング状態の表示テスト -->
<Story
    name="Loading State"
    args={{
        threads: [], // データがない状態でローディング
        visibleColumns: defaultVisibleColumns,
        initialSortState: { sortKey: "index", sortDirection: "asc" },
        isLoading: true,
        onSortChange: fn(),
        onRefresh: fn(),
        openThread: fn(),
        onContextMenu: fn(),
        openHeaderContextMenu: fn(),
    }}
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole("status", { name: /読み込み中/i })
        ).toBeInTheDocument();
        // データがないのでテーブル行はヘッダーのみ
        const rows = await canvas.findAllByRole("row");
        expect(rows.length).toBe(1);
    }}
/>

<!-- 4. データ表示中のローディング（透明オーバーレイ）テスト -->
<Story
    name="Loading State with Data"
    args={{
        threads: generateSampleThreads(5),
        visibleColumns: defaultVisibleColumns,
        initialSortState: { sortKey: "index", sortDirection: "asc" },
        isLoading: true,
        onSortChange: fn(),
        onRefresh: fn(),
        openThread: fn(),
        onContextMenu: fn(),
        openHeaderContextMenu: fn(),
    }}
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // ローディングスピナーが表示されていることを確認
        await expect(
            canvas.getByRole("status", { name: /読み込み中/i })
        ).toBeInTheDocument();
        // 背景のデータも表示されていることを確認
        await expect(
            canvas.getByText(/プログラミング初心者質問スレ/)
        ).toBeInTheDocument();
    }}
/>

<!-- 5. 空の状態のテスト -->
<Story
    name="Empty State"
    args={{
        threads: [],
        visibleColumns: defaultVisibleColumns,
        initialSortState: { sortKey: "index", sortDirection: "asc" },
        isLoading: false,
        onSortChange: fn(),
        onRefresh: fn(),
        openThread: fn(),
        onContextMenu: fn(),
        openHeaderContextMenu: fn(),
    }}
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // ヘッダー行のみ存在することを確認
        const rows = await canvas.findAllByRole("row");
        expect(rows.length).toBe(1);
    }}
/>

<!-- 6. ホイールによるリフレッシュ機能のテスト -->
<Story
    name="Wheel Refresh Interaction"
    args={{
        threads: generateSampleThreads(30), // スクロール可能にする
        visibleColumns: defaultVisibleColumns,
        initialSortState: { sortKey: "index", sortDirection: "asc" },
        isLoading: false,
        onSortChange: fn(),
        onRefresh: onRefreshAction, // onRefreshAction を args に渡す
        openThread: fn(),
        onContextMenu: fn(),
        openHeaderContextMenu: fn(),
    }}
    play={async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const table = canvas.getByRole("table");
        const scrollContainer = table.lastElementChild;

        scrollContainer.scrollTop = 0;

        // リフレッシュの閾値（デフォルトは7）までホイールイベントを発火
        for (let i = 0; i < 7; i++) {
            fireEvent.wheel(scrollContainer, { deltaY: -100 });
        }

        // onRefreshコールバックが1回呼ばれたことを確認
        await waitFor(() => {
            expect(args.onRefresh).toHaveBeenCalledTimes(1);
        });

        // onRefreshが呼ばれ、isLoading=trueになることでローディングスピナーが表示されるのを待つ
        // これが「ディレイ」中にスピナーが表示されている状態のテスト
        await waitFor(() => {
            expect(
                canvas.getByRole("status", { name: /読み込み中/i })
            ).toBeInTheDocument();
        });

        // ローディング完了後（sleep後）、成功インジケータが表示されるのを待つ
        await waitFor(
            () => {
                expect(canvas.getByText("✅️")).toBeInTheDocument();
            },
            { timeout: 2000 } // handleRefresh の sleep(1000ms) より長く待つ
        );

        // 成功インジケータが表示された後、スピナーが消えていることも確認
        expect(
            canvas.queryByRole("status", { name: /読み込み中/i })
        ).not.toBeInTheDocument();
    }}
>
    <ThreadListTable
        {...args}
        isLoading={isLoadingForWheelTest}
        onRefresh={handleRefreshForWheelTest}
    />
</Story>
