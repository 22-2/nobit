import type { Thread } from "@nobit/libch/core/types";
import {
    type OperationResult,
    type ThreadDataState as ThreadViewState,
    type ThreadDataStoreDependencies,
    type ThreadIdentifier,
} from "./types";
import { handleAsyncOperation } from "./helpers";

/**
 * スレッドデータの取得と状態管理に特化したSvelte 5ストアを作成します。
 * @param deps - 外部の依存関係 (BBSプロバイダなど)
 */
export function createThreadDataStore(deps: ThreadDataStoreDependencies) {
    const { initialThread, provider: bbsProvider, logger } = deps;

    const viewState = $state<ThreadViewState>({
        isLoading: false,
        error: null,
        autoReload: false,
        autoReloadInterval: 30000,
        autoScroll: false,
    });

    let threadState: Thread | null = $state({
        url: initialThread.url,
        title: initialThread.title ?? "",
        posts: initialThread.posts ?? [],
    });

    const loadThread = async (): Promise<void> => {
        const url = threadState?.url;
        if (!url) {
            logger.warn("loadThread called with invalid URL.");
            viewState.error = "スレッドのURLが無効です。";
            return;
        }
        logger.info("Loading thread...", { url });

        await handleAsyncOperation(() => bbsProvider.getThread(url), {
            onStart: () => {
                viewState.isLoading = true;
                viewState.error = null;
            },
            onSuccess: (threadData) => {
                if (threadData) threadState = threadData;
            },
            onError: (error) => {
                viewState.error =
                    error.message || "スレッドの取得に失敗しました";
                threadState = null;
            },
            onFinally: () => {
                viewState.isLoading = false;
            },
        });
    };

    const updateAndLoadThread = (threadIdentifier: ThreadIdentifier): void => {
        if (threadState?.url !== threadIdentifier.url) {
            threadState = threadIdentifier as Thread;
            viewState.error = null;
            loadThread().catch((e) =>
                logger.error("Failed to load thread after update", e)
            );
        }
    };

    $effect(() => {
        if (!viewState.autoReload || !threadState?.url) return;

        const timer = setInterval(() => {
            loadThread().catch((e) => logger.error("Auto-reload failed", e));
        }, viewState.autoReloadInterval);

        logger.info(
            `Auto-reload timer started with interval: ${viewState.autoReloadInterval}ms`
        );
        return () => {
            clearInterval(timer);
            logger.info("Auto-reload timer stopped.");
        };
    });

    if (initialThread.url) {
        loadThread().catch((e) =>
            logger.error("Initial thread load failed", e)
        );
    }

    return {
        viewState,
        thread: threadState,
        loadThread,
        updateAndLoadThread,
        setAutoReload: (enabled: boolean) => {
            viewState.autoReload = enabled;
        },
        setAutoScroll: (enabled: boolean) => {
            viewState.autoScroll = enabled;
        },
    };
}
