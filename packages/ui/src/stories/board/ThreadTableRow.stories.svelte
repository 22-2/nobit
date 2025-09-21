<script context="module">
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import ThreadTableRow from "../../view/board/ThreadTableRow.svelte";
    import CenterDecorator from "../helpers/CenterDecorator.svelte";
    import { fn } from "storybook/test";

    const defaultVisibleColumns = {
        index: true,
        title: true,
        resCount: true,
        ikioi: true,
    };

    const sampleThread = {
        id: (Date.now() / 1000 - 3600).toString(),
        title: "サンプルスレッドタイトル",
        resCount: 150,
        index: 1,
    };

    const { Story } = defineMeta({
        title: "Board/ThreadTableRow",
        component: ThreadTableRow,
        tags: ["autodocs"],
        argTypes: {
            thread: {
                control: "object",
                description: "スレッドデータ",
            },
            visibleColumns: {
                control: "object",
                description: "表示する列の設定",
            },
            onMouseDown: {
                action: "onMouseDown",
                description: "マウスダウン時のコールバック",
            },
            onContextMenu: {
                action: "onContextMenu",
                description: "右クリックメニュー表示のコールバック",
            },
        },
        decorators: [
            (StoryComponent) => ({
                Component: CenterDecorator,
                props: {
                    children: StoryComponent,
                    padding: "var(--size-4-4)",
                    minHeight: "var(--size-4-20)",
                },
            }),
        ],
    });
</script>

<Story
    name="Default"
    args={{
        thread: sampleThread,
        visibleColumns: defaultVisibleColumns,
        onMouseDown: fn(),
        onContextMenu: fn(),
    }}
/>

<Story
    name="Long Title"
    args={{
        thread: {
            ...sampleThread,
            title: "これは非常に長いタイトルのスレッドです。テキストオーバーフローの動作を確認するために意図的に長くしています。",
        },
        visibleColumns: defaultVisibleColumns,
        onMouseDown: fn(),
        onContextMenu: fn(),
    }}
/>

<Story
    name="Hidden Columns"
    args={{
        thread: sampleThread,
        visibleColumns: {
            index: false,
            title: true,
            resCount: true,
            ikioi: false,
        },
        onMouseDown: fn(),
        onContextMenu: fn(),
    }}
/>

<Story
    name="High Ikioi"
    args={{
        thread: {
            id: (Date.now() / 1000).toString(), // 現在時刻（新しいスレッド）
            title: "勢いの高いスレッド",
            resCount: 500,
            index: 1,
        },
        visibleColumns: defaultVisibleColumns,
        onMouseDown: fn(),
        onContextMenu: fn(),
    }}
/>
