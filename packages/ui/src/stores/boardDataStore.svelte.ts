import type { BoardDataStoreDependencies, BoardDataState } from "./types";

/**
 * 板のスレッド一覧データ取得と状態管理に特化したSvelte 5ストアを作成します。
 */
export function createBoardDataStore(deps: BoardDataStoreDependencies) {
    const { initialUrl, provider: boardProvider, logger } = deps;

    const state = $state<BoardDataState>({
        title: null,
        currentUrl: initialUrl,
        threads: [],
        isLoading: false,
        error: null,
    });

    const loadThreads = async (): Promise<void> => {
        const url = state.currentUrl;
        if (!url) {
            state.error = "板のURLが無効です。";
            logger.warn("loadThreads called with invalid URL.");
            return;
        }

        state.isLoading = true;
        state.error = null;

        try {
            const [threads, title] = await Promise.all([
                boardProvider.getThreads(url),
                boardProvider.getBoardTitle(url),
            ]);
            state.threads = threads;
            state.title = title;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            state.error = error.message || "スレッド一覧の取得に失敗しました";
            state.threads = [];
            logger.error("Failed to load threads", error);
        } finally {
            state.isLoading = false;
        }
    };

    const updateUrl = (newUrl: string): void => {
        if (state.currentUrl !== newUrl) {
            state.currentUrl = newUrl;
            loadThreads();
        }
    };

    // 初期読み込み
    if (initialUrl) {
        loadThreads();
    }

    return {
        state,
        loadThreads,
        updateUrl,
    };
}
