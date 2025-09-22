import type { Thread } from "@nobit/libch/core/types";
import {
    type OperationResult,
    type ThreadDataState,
    type ThreadDataStoreDependencies,
    type ThreadIdentifier,
} from "./types";

/**
 * スレッドデータの取得と状態管理に特化したSvelte 5ストアを作成します。
 * @param deps - 外部の依存関係 (BBSプロバイダなど)
 */
export function createThreadDataStore(deps: ThreadDataStoreDependencies) {
    const { initialThread, provider: bbsProvider, logger } = deps;

    const threadState = $state<ThreadDataState>({
        thread: {
            url: initialThread.url,
            title: initialThread.title ?? "",
            posts: initialThread.posts ?? [],
        },
        isLoading: false,
        error: null,
        autoReload: false,
        autoReloadInterval: 30000,
        autoScroll: false,
    });

    const handleAsyncOperation = async <T>(
        operation: () => Promise<T>,
        options: OperationResult<T> = {}
    ): Promise<T | null> => {
        const {
            errorMessage = "操作に失敗しました",
            onStart,
            onSuccess,
            onError,
            onFinally,
        } = options;
        try {
            onStart?.();
            const result = await operation();
            onSuccess?.(result);
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            logger.error(errorMessage, error);
            onError?.(error);
            return null;
        } finally {
            onFinally?.();
        }
    };

    const loadThread = async (): Promise<void> => {
        const url = threadState.thread?.url;
        if (!url) {
            logger.warn("loadThread called with invalid URL.");
            threadState.error = "スレッドのURLが無効です。";
            return;
        }
        logger.info("Loading thread...", { url });

        await handleAsyncOperation(() => bbsProvider.getThread(url), {
            onStart: () => {
                threadState.isLoading = true;
                threadState.error = null;
            },
            onSuccess: (threadData) => {
                if (threadData) threadState.thread = threadData;
            },
            onError: (error) => {
                threadState.error =
                    error.message || "スレッドの取得に失敗しました";
                threadState.thread = null;
            },
            onFinally: () => {
                threadState.isLoading = false;
            },
        });
    };

    const updateAndLoadThread = (threadIdentifier: ThreadIdentifier): void => {
        if (threadState.thread?.url !== threadIdentifier.url) {
            threadState.thread = threadIdentifier as Thread;
            threadState.error = null;
            loadThread().catch((e) =>
                logger.error("Failed to load thread after update", e)
            );
        }
    };

    $effect(() => {
        if (!threadState.autoReload || !threadState.thread?.url) return;

        const timer = setInterval(() => {
            loadThread().catch((e) => logger.error("Auto-reload failed", e));
        }, threadState.autoReloadInterval);

        logger.info(
            `Auto-reload timer started with interval: ${threadState.autoReloadInterval}ms`
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
        thread: threadState,
        loadThread,
        updateAndLoadThread,
        setAutoReload: (enabled: boolean) => {
            threadState.autoReload = enabled;
        },
        setAutoScroll: (enabled: boolean) => {
            threadState.autoScroll = enabled;
        },
    };
}
