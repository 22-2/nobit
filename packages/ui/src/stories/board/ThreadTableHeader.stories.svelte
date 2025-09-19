<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import ThreadTableHeader from "../view/board/ThreadTableHeader.svelte";
    import CenterDecorator from "./helpers/CenterDecorator.svelte";
    import { fn } from "storybook/test";

    const defaultVisibleColumns = {
        index: true,
        title: true,
        resCount: true,
        ikioi: true,
    };

    const { Story } = defineMeta({
        title: "Board/ThreadTableHeader",
        component: ThreadTableHeader,
        tags: ["autodocs"],
        argTypes: {
            visibleColumns: {
                control: "object",
                description: "表示する列の設定",
            },
            sortKey: {
                control: "text",
                description: "現在のソートキー",
            },
            sortDirection: {
                control: "select",
                options: ["asc", "desc"],
                description: "ソート方向",
            },
            onSort: {
                action: "onSort",
                description: "ソート変更時のコールバック",
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
        visibleColumns: defaultVisibleColumns,
        sortKey: null,
        sortDirection: "asc",
        onSort: fn(),
        onContextMenu: fn(),
    }}
/>

<Story
    name="Sorted by Index"
    args={{
        visibleColumns: defaultVisibleColumns,
        sortKey: "index",
        sortDirection: "asc",
        onSort: fn(),
        onContextMenu: fn(),
    }}
/>

<Story
    name="Sorted by ResCount Desc"
    args={{
        visibleColumns: defaultVisibleColumns,
        sortKey: "resCount",
        sortDirection: "desc",
        onSort: fn(),
        onContextMenu: fn(),
    }}
/>

<Story
    name="Hidden Columns"
    args={{
        visibleColumns: {
            index: false,
            title: true,
            resCount: true,
            ikioi: false,
        },
        sortKey: "title",
        sortDirection: "asc",
        onSort: fn(),
        onContextMenu: fn(),
    }}
/>
