<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import BBSThreadTable from "../view/board/BBSThreadTable.svelte";
    import CenterDecorator from "./helpers/CenterDecorator.svelte";
    import { fn } from "storybook/test";

    // サンプルデータの生成
    const generateSampleThreads = (count = 20) => {
        const titles = [
            "【雑談】今日の出来事について語ろう",
            "プログラミング初心者質問スレ",
            "【速報】新しいフレームワークがリリース",
            "デバッグで困ったときの対処法",
            "コードレビューのコツを教えて",
            "【議論】最適なアーキテクチャとは",
            "エラーハンドリングのベストプラクティス",
            "【質問】この実装どう思う？",
            "パフォーマンス改善の事例集",
            "【情報共有】便利なツール紹介",
        ];

        return Array.from({ length: count }, (_, i) => ({
            id: (Date.now() / 1000 - i * 3600).toString(), // 1時間ずつ古いタイムスタンプ
            title: titles[i % titles.length] + ` (${i + 1})`,
            resCount: Math.floor(Math.random() * 1000) + 1,
        }));
    };

    const defaultVisibleColumns = {
        index: true,
        title: true,
        resCount: true,
        ikioi: true,
    };

    const { Story } = defineMeta({
        title: "UI/BBSThreadTable",
        component: BBSThreadTable,
        tags: ["autodocs"],
        argTypes: {
            threads: {
                control: false,
                description: "表示するスレッドのリスト",
            },
            visibleColumns: {
                control: "object",
                description: "表示する列の設定",
            },
            initialSortState: {
                control: "object",
                description: "初期ソート状態",
            },
            onSortChange: {
                action: "onSortChange",
                description: "ソート変更時のコールバック",
            },
            openThread: {
                action: "openThread",
                description: "スレッドクリック時のコールバック",
            },
            openContextMenu: {
                action: "openContextMenu",
                description: "右クリックメニュー表示のコールバック",
            },
            openHeaderContextMenu: {
                action: "openHeaderContextMenu",
                description: "ヘッダー右クリックメニュー表示のコールバック",
            },
        },
        decorators: [
            (StoryComponent) => ({
                Component: CenterDecorator,
                props: {
                    children: StoryComponent,
                    padding: "var(--size-4-4)" /* 16px */,
                    minHeight: "var(--size-4-125)" /* 500px相当 */,
                },
            }),
        ],
    });
</script>

<!-- デフォルトの状態 -->
<Story
    name="Default"
    args={{
        threads: generateSampleThreads(20),
        visibleColumns: defaultVisibleColumns,
        initialSortState: { key: "index", direction: "asc" },
        onSortChange: fn(),
        openThread: fn(),
        openContextMenu: fn(),
        openHeaderContextMenu: fn(),
    }}
/>

<!-- 少ないデータ -->
<Story
    name="Few Threads"
    args={{
        threads: generateSampleThreads(5),
        visibleColumns: defaultVisibleColumns,
        initialSortState: { key: "index", direction: "asc" },
        onSortChange: fn(),
        openThread: fn(),
        openContextMenu: fn(),
        openHeaderContextMenu: fn(),
    }}
/>

<!-- 空のデータ -->
<Story
    name="Empty"
    args={{
        threads: [],
        visibleColumns: defaultVisibleColumns,
        initialSortState: { key: "index", direction: "asc" },
        onSortChange: fn(),
        openThread: fn(),
        openContextMenu: fn(),
        openHeaderContextMenu: fn(),
    }}
/>

<!-- レス数でソート済み -->
<Story
    name="Sorted by ResCount"
    args={{
        threads: generateSampleThreads(15),
        visibleColumns: defaultVisibleColumns,
        initialSortState: { key: "resCount", direction: "desc" },
        onSortChange: fn(),
        openThread: fn(),
        openContextMenu: fn(),
        openHeaderContextMenu: fn(),
    }}
/>

<!-- 勢いでソート済み -->
<Story
    name="Sorted by Ikioi"
    args={{
        threads: generateSampleThreads(15),
        visibleColumns: defaultVisibleColumns,
        initialSortState: { key: "ikioi", direction: "desc" },
        onSortChange: fn(),
        openThread: fn(),
        openContextMenu: fn(),
        openHeaderContextMenu: fn(),
    }}
/>

<!-- 一部の列を非表示 -->
<Story
    name="Hidden Columns"
    args={{
        threads: generateSampleThreads(15),
        visibleColumns: {
            index: false,
            title: true,
            resCount: true,
            ikioi: false,
        },
        initialSortState: { key: "resCount", direction: "desc" },
        onSortChange: fn(),
        openThread: fn(),
        openContextMenu: fn(),
        openHeaderContextMenu: fn(),
    }}
/>

<!-- タイトルのみ表示 -->
<Story
    name="Title Only"
    args={{
        threads: generateSampleThreads(10),
        visibleColumns: {
            index: false,
            title: true,
            resCount: false,
            ikioi: false,
        },
        initialSortState: { key: "title", direction: "asc" },
        onSortChange: fn(),
        openThread: fn(),
        openContextMenu: fn(),
        openHeaderContextMenu: fn(),
    }}
/>

<!-- 長いタイトルのテスト -->
<Story
    name="Long Titles"
    args={{
        threads: [
            {
                id: "1640995200",
                title: "これは非常に長いタイトルのスレッドです。テキストオーバーフローの動作を確認するために意図的に長くしています。",
                resCount: 150,
            },
            {
                id: "1640991600",
                title: "短いタイトル",
                resCount: 50,
            },
            {
                id: "1640988000",
                title: "Another extremely long thread title that should be truncated with ellipsis when it exceeds the available space in the table cell",
                resCount: 300,
            },
            {
                id: "1640984400",
                title: "普通の長さのタイトル例",
                resCount: 75,
            },
        ],
        visibleColumns: defaultVisibleColumns,
        initialSortState: { key: "index", direction: "asc" },
        onSortChange: fn(),
        openThread: fn(),
        openContextMenu: fn(),
        openHeaderContextMenu: fn(),
    }}
/>

<!-- 大量データ -->
<Story
    name="Large Dataset"
    args={{
        threads: generateSampleThreads(100),
        visibleColumns: defaultVisibleColumns,
        initialSortState: { key: "ikioi", direction: "desc" },
        onSortChange: fn(),
        openThread: fn(),
        openContextMenu: fn(),
        openHeaderContextMenu: fn(),
    }}
/>

<!-- 勢いの値が様々なパターン -->
<Story
    name="Various Ikioi Values"
    args={{
        threads: [
            {
                id: (Date.now() / 1000).toString(), // 現在時刻（新しいスレッド）
                title: "新しいスレッド（勢い高）",
                resCount: 500,
            },
            {
                id: (Date.now() / 1000 - 86400).toString(), // 1日前
                title: "1日前のスレッド",
                resCount: 100,
            },
            {
                id: (Date.now() / 1000 - 604800).toString(), // 1週間前
                title: "1週間前のスレッド",
                resCount: 50,
            },
            {
                id: (Date.now() / 1000 - 2592000).toString(), // 1ヶ月前
                title: "1ヶ月前のスレッド（勢い低）",
                resCount: 10,
            },
            {
                id: "invalid_timestamp", // 無効なタイムスタンプ
                title: "無効なタイムスタンプのスレッド",
                resCount: 25,
            },
        ],
        visibleColumns: defaultVisibleColumns,
        initialSortState: { key: "ikioi", direction: "desc" },
        onSortChange: fn(),
        openThread: fn(),
        openContextMenu: fn(),
        openHeaderContextMenu: fn(),
    }}
/>
