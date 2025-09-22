<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import { createBoardDataStore } from "../../stores/boardDataStore.svelte";
    import type { IBoardProvider, ILogger } from "../../stores/types";
    import ThreadListTable from "../../view/board/ThreadListTable.svelte";
    import { fn, userEvent, within } from "storybook/test";

    // --- Mock Data and Services ---

    const mockThreads = Array.from({ length: 50 }, (_, i) => ({
        id: (Date.now() / 1000 - i * 3600 - 1000).toString(),
        title: `【テスト】スレッドのタイトル${i + 1}【レス${
            Math.floor(Math.random() * 999) + 1
        }】`,
        resCount: Math.floor(Math.random() * 1000) + 1,
    }));

    const createMockBoardProvider = ({
        networkDelay = 0,
        shouldFail = false,
        isEmpty = false,
    } = {}): IBoardProvider => ({
        getThreads: async (url: string) => {
            console.log(
                `[Mock] Fetching threads from ${url} with ${networkDelay}ms delay...`
            );
            await new Promise((resolve) => setTimeout(resolve, networkDelay));
            if (shouldFail) {
                throw new Error("モック: スレッド一覧の取得に失敗しました。");
            }
            return isEmpty ? [] : mockThreads;
        },
        getBoardTitle: async (url: string) => {
            console.log(`[Mock] Fetching board title from ${url}...`);
            await new Promise((resolve) =>
                setTimeout(resolve, networkDelay / 2)
            );
            if (shouldFail) {
                throw new Error("モック: 板タイトルの取得に失敗しました。");
            }
            return "テスト用掲示板";
        },
    });

    const mockLogger: ILogger = {
        info: console.info,
        warn: console.warn,
        error: console.error,
    };

    const defaultVisibleColumns = {
        index: true,
        title: true,
        resCount: true,
        ikioi: true,
    };

    const defaultSortState = { sortKey: "index", sortDirection: "asc" };

    // --- Storybook Meta ---

    const { Story, meta } = defineMeta({
        title: "Board/ThreadListTable (Integration)",
        component: ThreadListTable,
        tags: ["autodocs"],
        argTypes: {
            networkDelay: {
                control: { type: "range", min: 0, max: 5000, step: 100 },
                description: "データ取得の擬似的な遅延 (ms)",
            },
            shouldFail: {
                control: "boolean",
                description: "データ取得を強制的に失敗させるか",
            },
            isEmpty: {
                control: "boolean",
                description: "空のスレッド一覧を返すか",
            },
        },
    });
</script>

<script lang="ts">
    type Args = {
        networkDelay?: number;
        shouldFail?: boolean;
        isEmpty?: boolean;
    };
    let { args }: { args: Args } = $props();

    // ストーリーが再描画されるたびにストアを再生成
    const store = $derived(
        createBoardDataStore({
            initialUrl: "https://example.com/test/board/",
            boardProvider: createMockBoardProvider(args),
            logger: mockLogger,
        })
    );
</script>

//
E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\stories\board\ThreadListTable.stories.svelte
<div class="story-container">
    <div class="story-controls">
        <p>
            <strong>テスト用コントロール:</strong>
            <button onclick={() => store.loadThreads()}>手動更新</button>
            <button
                onclick={() =>
                    store.updateUrl("https://example.com/test/newboard/")}
            >
                URL更新
            </button>
        </p>
        {#if store.state.error}
            <p class="error-message">エラー: {store.state.error}</p>
        {/if}
    </div>

    <ThreadListTable
        threads={store.state.threads}
        isLoading={store.state.isLoading}
        visibleColumns={defaultVisibleColumns}
        initialSortState={defaultSortState}
        onRefresh={store.loadThreads}
        onSortChange={fn()}
        openThread={fn()}
        onContextMenu={fn()}
        openHeaderContextMenu={fn()}
    />
</div>

<Story
    name="Default"
    args={{
        networkDelay: 500,
        shouldFail: false,
        isEmpty: false,
    }}
/>

<Story
    name="Loading"
    args={{
        networkDelay: 100000, // ローディング状態を長く表示するために大きな値を設定
        shouldFail: false,
        isEmpty: false,
    }}
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);
        await step(
            "ローディングスピナーが表示されていることを確認",
            async () => {
                await canvas.findByRole("status");
            }
        );
    }}
/>

<Story
    name="Error"
    args={{
        networkDelay: 500,
        shouldFail: true,
        isEmpty: false,
    }}
/>

<Story
    name="Empty"
    args={{
        networkDelay: 500,
        shouldFail: false,
        isEmpty: true,
    }}
/>

<style>
    .story-container {
        height: 600px;
        width: 100%;
        max-width: 800px;
        border: 1px solid var(--nobit-background-modifier-border);
        display: flex;
        flex-direction: column;
    }
    .story-controls {
        padding: var(--nobit-size-4-2) var(--nobit-size-4-4);
        border-bottom: 1px solid var(--nobit-background-modifier-border);
        background-color: var(--nobit-background-secondary);
    }
    .error-message {
        color: var(--nobit-text-danger);
        font-weight: var(--nobit-font-semibold);
    }
</style>
