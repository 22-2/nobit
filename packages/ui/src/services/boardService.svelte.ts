import type { SubjectItem } from "@repo/libch/core/types";
import type MyPlugin from "src/main";
import type { VisibleColumns, SortState } from "src/types";
import { BaseService, type OperationResult } from "./BaseService.svelte";
import type { Menu } from "obsidian";
import { get } from "svelte/store";

export type TableSortKey = "index" | "title" | "resCount" | "ikioi";

export interface TableItem {
    key: TableSortKey;
    label: string;
    disabled?: boolean;
}
// 定数としてヘッダー情報を定義
const TABLE_HEADERS: TableItem[] = [
    { key: "index", label: "#" },
    { key: "title", label: "タイトル", disabled: true }, // タイトルは常に表示するため無効化
    { key: "resCount", label: "レス" },
    { key: "ikioi", label: "勢い" },
];

export interface BoardServiceState {
    board: {
        title: string | null;
        currentUrl: string;
        threads: SubjectItem[];
    };
    isLoading: boolean;
    error: string | null;
    useVirtualScroll: boolean;
    enableWheelRefresh: boolean;
    uiState: {
        visibleColumns: VisibleColumns;
        sortState: SortState;
    };
}

export class BoardService extends BaseService<BoardServiceState> {
    constructor(
        plugin: MyPlugin,
        initialUrl: string,
        initialSortState: SortState
    ) {
        const initialState: BoardServiceState = {
            isLoading: false,
            board: {
                title: null,
                currentUrl: initialUrl,
                threads: [],
            },
            error: null,
            useVirtualScroll: plugin.settings.useVirtualScroll,
            enableWheelRefresh: plugin.settings.enableWheelRefresh,
            uiState: {
                visibleColumns: plugin.settings.visibleColumns,
                sortState: initialSortState,
            },
        };

        super(plugin, "BoardService", initialState);

        if (initialUrl) {
            this.loadThreads();
        }
    }

    async loadThreads() {
        const url = get(this.state).board.currentUrl;
        if (!url) {
            this.state.update((s) => ({ ...s, error: "板のURLが無効です。" }));
            return;
        }

        await this.handleAsyncOperation(
            async () => {
                const [threads, title] = await Promise.all([
                    this.workerBBSProvider.getThreads(url),
                    this.workerBBSProvider.getBoardTitle(url),
                ]);
                return { threads, title };
            },
            {
                onStart: () => {
                    this.state.update((s) => ({
                        ...s,
                        isLoading: true,
                        error: null,
                    }));
                },
                onSuccess: (result) => {
                    if (result) {
                        this.state.update((s) => ({
                            ...s,
                            board: {
                                ...s.board,
                                threads: result.threads,
                                title: result.title,
                            },
                        }));
                    }
                },
                onError: (error) => {
                    this.state.update((s) => ({
                        ...s,
                        error:
                            error.message || "スレッド一覧の取得に失敗しました",
                        board: {
                            ...s.board,
                            threads: [],
                        },
                    }));
                },
                onFinally: () => {
                    this.state.update((s) => ({ ...s, isLoading: false }));
                },
                errorMessage: "スレッド一覧の取得に失敗しました",
            }
        );
    }

    updateUrl(newUrl: string) {
        if (get(this.state).board.currentUrl !== newUrl) {
            this.state.update((s) => ({
                ...s,
                board: { ...s.board, currentUrl: newUrl },
            }));
            this.loadThreads();
        }
    }

    setSortState(newState: SortState) {
        this.state.update((s) => ({
            ...s,
            uiState: { ...s.uiState, sortState: newState },
        }));
        this.plugin.saveSettings({
            sortKey: newState.sortKey,
            sortDirection: newState.sortDirection,
        });
    }

    setVisibleColumns(newColumns: VisibleColumns) {
        this.state.update((s) => ({
            ...s,
            uiState: { ...s.uiState, visibleColumns: newColumns },
        }));
        this.plugin.saveSettings({
            visibleColumns: newColumns,
        });
    }

    /**
     * スレッドの完全なURLを生成するヘルパーメソッド
     */
    private getThreadUrl(thread: SubjectItem): string | null {
        const boardInfo = this.parseUrl(get(this.state).board.currentUrl);
        if (!boardInfo) return null;

        const { host, board } = boardInfo;
        return `https://${host}/test/read.cgi/${board}/${thread.id}/`;
    }

    openThread(thread: SubjectItem, e: MouseEvent) {
        if (e.button === 2) return; // 右クリックは無視

        const threadUrl = this.getThreadUrl(thread);
        if (threadUrl) {
            e.preventDefault();
            this.plugin.openWithUrl(threadUrl);
        }
    }

    openContextMenu(thread: SubjectItem, menu: Menu) {
        const threadUrl = this.getThreadUrl(thread);

        if (!threadUrl) {
            menu.addItem((item: any) =>
                item.setTitle("エラー：板URLが無効です").setDisabled(true)
            );
            return;
        }

        this.addContextMenuItem(
            menu,
            "ブラウザで開く",
            "open-in-new-tab",
            () => {
                window.open(threadUrl, "_blank");
            }
        );

        this.addContextMenuItem(menu, "URLをコピー", "copy", () => {
            navigator.clipboard.writeText(threadUrl);
            this.plugin.deps.notifier("コピーしました");
        });
    }

    openHeaderContextMenu(menu: any) {
        const currentState = get(this.state);
        TABLE_HEADERS.forEach(({ key, label, disabled }) => {
            menu.addItem((item: any) => {
                item.setTitle(label)
                    .setChecked(
                        currentState.uiState.visibleColumns[key] ?? false
                    )
                    .setDisabled(!!disabled)
                    .onClick(() => {
                        const newVisibleColumns = {
                            ...currentState.uiState.visibleColumns,
                            [key]: !currentState.uiState.visibleColumns[key],
                        };
                        this.setVisibleColumns(newVisibleColumns);
                    });
            });
        });
    }
}
