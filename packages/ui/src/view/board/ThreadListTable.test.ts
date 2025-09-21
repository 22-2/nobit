// E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\view\board\ThreadListTable.test.ts
import "@testing-library/jest-dom/vitest";
import "@testing-library/svelte";
import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { tick } from "svelte";
import { expect, test, vi } from "vitest";
import ThreadListTable from "./ThreadListTable.svelte";
import log from "loglevel";
import type { IBoardProvider, SorterState } from "../../stores/types";
import { createBoardDataStore } from "../../stores/boardDataStore.svelte";

const mockThreads = [
    { id: "1", title: "Thread 1", resCount: 100 },
    { id: "2", title: "Thread 2", resCount: 200 },
    { id: "3", title: "Thread 3", resCount: 50 },
];

const mockVisibleColumns = {
    index: true,
    title: true,
    resCount: true,
    ikioi: true,
};

const mockInitialSortState: SorterState = {
    sortDirection: "asc",
    sortKey: "index",
};

test("renders thread list table with initial data", () => {
    render(ThreadListTable, {
        threads: mockThreads,
        visibleColumns: mockVisibleColumns,
        initialSortState: mockInitialSortState,
        onSortChange: () => {},
        openThread: () => {},
        onContextMenu: () => {},
        openHeaderContextMenu: () => {},
    });

    expect(screen.getByText("Thread 1")).toBeInTheDocument();
    expect(screen.getByText("Thread 2")).toBeInTheDocument();
    expect(screen.getByText("Thread 3")).toBeInTheDocument();
});

test("sorts threads when table header is clicked", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();

    render(ThreadListTable, {
        threads: mockThreads,
        visibleColumns: mockVisibleColumns,
        initialSortState: mockInitialSortState,
        onSortChange: onSortChange,
        openThread: () => {},
        onContextMenu: () => {},
        openHeaderContextMenu: () => {},
    });

    const titleHeader = screen.getByText("タイトル");
    await user.click(titleHeader);

    expect(onSortChange).toHaveBeenCalledWith({
        sortKey: "title",
        sortDirection: "asc",
    });
});

test("integrates with boardDataStore", async () => {
    const mockBoardProvider: IBoardProvider = {
        getThreads: vi.fn().mockResolvedValue(mockThreads),
        getBoardTitle: vi.fn().mockResolvedValue("Test Board"),
    };

    const store = createBoardDataStore({
        initialUrl: "http://example.com",
        boardProvider: mockBoardProvider,
        logger: log,
    });

    // ストアの非同期処理(loadThreads)が完了するのを待つ
    // `await tick()` はSvelteの更新を待つもので、外部のPromise解決を保証しないため不十分。
    // イベントループを次に進めて、Promiseの解決と状態更新を待つ。
    await new Promise((resolve) => setTimeout(resolve, 0));

    // データが完全にロードされた状態でコンポーネントを描画する
    render(ThreadListTable, {
        threads: store.state.threads, // ここにはmockThreadsが入っているはず
        visibleColumns: mockVisibleColumns,
        initialSortState: mockInitialSortState,
        onSortChange: () => {},
        openThread: () => {},
        onContextMenu: () => {},
        openHeaderContextMenu: () => {},
    });

    // データが描画されていることを確認
    expect(screen.getByText("Thread 1")).toBeInTheDocument();
    expect(screen.getByText("Thread 2")).toBeInTheDocument();
    expect(screen.getByText("Thread 3")).toBeInTheDocument();
});
