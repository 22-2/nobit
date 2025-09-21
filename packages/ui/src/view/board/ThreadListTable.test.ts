// E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\view\board\ThreadListTable.test.ts
import "@testing-library/jest-dom/vitest";
import "@testing-library/svelte";
import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { expect, test, vi, describe } from "vitest";
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

describe("ThreadListTable Rendering", () => {
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

    test("renders nothing when threads array is empty", () => {
        render(ThreadListTable, {
            threads: [],
            visibleColumns: mockVisibleColumns,
            initialSortState: mockInitialSortState,
            onSortChange: () => {},
            openThread: () => {},
            onContextMenu: () => {},
            openHeaderContextMenu: () => {},
        });
        expect(screen.queryByText("Thread 1")).not.toBeInTheDocument();
        // rowgroup (tbody) is empty
        expect(screen.getByRole("rowgroup").children).toHaveLength(0);
    });

    test("hides columns based on visibleColumns prop", () => {
        render(ThreadListTable, {
            threads: mockThreads,
            visibleColumns: { ...mockVisibleColumns, ikioi: false },
            initialSortState: mockInitialSortState,
            onSortChange: () => {},
            openThread: () => {},
            onContextMenu: () => {},
            openHeaderContextMenu: () => {},
        });

        expect(screen.getByText("タイトル")).toBeInTheDocument();
        expect(screen.queryByText("勢い")).not.toBeInTheDocument();

        // Check if cells for the hidden column are not rendered
        const header = screen.getByRole("rowheader");
        // header row should have 3 column headers
        expect(header.querySelectorAll('[role="columnheader"]')).toHaveLength(
            3
        );
        // data row should have 3 cells
        const dataRows = screen.getAllByRole("row");
        expect(dataRows[0].querySelectorAll('[role="cell"]')).toHaveLength(3);
    });
});

describe("ThreadListTable Sorting", () => {
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

    test("toggles sort direction on second click", async () => {
        const user = userEvent.setup();
        const onSortChange = vi.fn();
        render(ThreadListTable, {
            threads: mockThreads,
            visibleColumns: mockVisibleColumns,
            initialSortState: { sortKey: "title", sortDirection: "asc" },
            onSortChange: onSortChange,
            openThread: () => {},
            onContextMenu: () => {},
            openHeaderContextMenu: () => {},
        });

        const titleHeader = screen.getByText("タイトル");
        await user.click(titleHeader);

        expect(onSortChange).toHaveBeenCalledWith({
            sortKey: "title",
            sortDirection: "desc",
        });
    });

    test("changes sort key and uses default direction for new column", async () => {
        const user = userEvent.setup();
        const onSortChange = vi.fn();
        render(ThreadListTable, {
            threads: mockThreads,
            visibleColumns: mockVisibleColumns,
            initialSortState: { sortKey: "index", sortDirection: "asc" },
            onSortChange: onSortChange,
            openThread: () => {},
            onContextMenu: () => {},
            openHeaderContextMenu: () => {},
        });

        const resHeader = screen.getByText("レス");
        await user.click(resHeader);

        // resCount has 'desc' as default direction
        expect(onSortChange).toHaveBeenCalledWith({
            sortKey: "resCount",
            sortDirection: "desc",
        });
    });

    test("sorts correctly with keyboard events (Enter)", async () => {
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
        titleHeader.focus();
        await user.keyboard("{Enter}");

        expect(onSortChange).toHaveBeenCalledWith({
            sortKey: "title",
            sortDirection: "asc",
        });
    });

    test("sorts correctly with keyboard events (Space)", async () => {
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
        titleHeader.focus();
        await user.keyboard(" ");

        expect(onSortChange).toHaveBeenCalledWith({
            sortKey: "title",
            sortDirection: "asc",
        });
    });
});

describe("ThreadListTable Row Interactions", () => {
    test("calls openThread on left click", async () => {
        const user = userEvent.setup();
        const openThread = vi.fn();
        render(ThreadListTable, {
            threads: mockThreads,
            visibleColumns: mockVisibleColumns,
            initialSortState: mockInitialSortState,
            onSortChange: () => {},
            openThread: openThread,
            onContextMenu: () => {},
            openHeaderContextMenu: () => {},
        });

        const firstRow = screen.getByText("Thread 1");
        await user.click(firstRow);

        expect(openThread).toHaveBeenCalledOnce();
        expect(openThread.mock.calls[0][0]).toMatchObject({
            id: "1",
            title: "Thread 1",
        });
    });

    test("calls openThread on middle click", async () => {
        const user = userEvent.setup();
        const openThread = vi.fn();
        render(ThreadListTable, {
            threads: mockThreads,
            visibleColumns: mockVisibleColumns,
            initialSortState: mockInitialSortState,
            onSortChange: () => {},
            openThread: openThread,
            onContextMenu: () => {},
            openHeaderContextMenu: () => {},
        });

        const firstRow = screen.getByText("Thread 1");
        await user.pointer({ keys: "[MouseMiddle]", target: firstRow });

        expect(openThread).toHaveBeenCalledOnce();
        expect(openThread.mock.calls[0][0]).toMatchObject({
            id: "1",
            title: "Thread 1",
        });
    });

    test("calls onContextMenu on right click", async () => {
        const user = userEvent.setup();
        const onContextMenu = vi.fn();
        render(ThreadListTable, {
            threads: mockThreads,
            visibleColumns: mockVisibleColumns,
            initialSortState: mockInitialSortState,
            onSortChange: () => {},
            openThread: () => {},
            onContextMenu: onContextMenu,
            openHeaderContextMenu: () => {},
        });

        const firstRow = screen.getByText("Thread 1");
        await user.pointer({ keys: "[MouseRight]", target: firstRow });

        expect(onContextMenu).toHaveBeenCalledOnce();
        expect(onContextMenu.mock.calls[0][0]).toMatchObject({
            id: "1",
            title: "Thread 1",
        });
    });
});

describe("ThreadListTable Header Interactions", () => {
    test("calls openHeaderContextMenu on header right click", async () => {
        const user = userEvent.setup();
        const openHeaderContextMenu = vi.fn();
        render(ThreadListTable, {
            threads: mockThreads,
            visibleColumns: mockVisibleColumns,
            initialSortState: mockInitialSortState,
            onSortChange: () => {},
            openThread: () => {},
            onContextMenu: () => {},
            openHeaderContextMenu: openHeaderContextMenu,
        });

        const header = screen.getByRole("rowheader");
        await user.pointer({ keys: "[MouseRight]", target: header });

        expect(openHeaderContextMenu).toHaveBeenCalledOnce();
    });
});

describe("Integration with boardDataStore", () => {
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

        // Wait for the async operation (loadThreads) in the store to complete
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Render the component with the fully loaded state
        render(ThreadListTable, {
            threads: store.state.threads, // Should contain mockThreads
            visibleColumns: mockVisibleColumns,
            initialSortState: mockInitialSortState,
            onSortChange: () => {},
            openThread: () => {},
            onContextMenu: () => {},
            openHeaderContextMenu: () => {},
        });

        // Verify that the data is rendered
        expect(screen.getByText("Thread 1")).toBeInTheDocument();
        expect(screen.getByText("Thread 2")).toBeInTheDocument();
        expect(screen.getByText("Thread 3")).toBeInTheDocument();
    });
});
