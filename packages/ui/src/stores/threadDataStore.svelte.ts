// E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\stores\threadDataStore.svelte.ts
import type { Thread } from "@nobit/libch/core/types";
import {
    type SimpleOperationResult,
    type ThreadDataState,
    type ThreadDataStoreDependencies,
    type ThreadIdentifier,
} from "./types";
import { handleAsyncOperation } from "./helpers";
import type { PostData } from "@nobit/libch/core/types";
import log from "loglevel";

/**
 * スレッドデータの取得と状態管理に特化したSvelte 5ストアを作成します。
 * @param deps - 外部の依存関係 (BBSプロバイダなど)
 */
export function createThreadDataStore(deps: ThreadDataStoreDependencies) {
    const { initialThread, provider: bbsProvider, logger } = deps;

    const viewState = $state<ThreadDataState>({
        isLoading: false,
        error: null,
        autoReload: false,
        autoReloadInterval: 30000,
        autoScroll: false,
        isSubmitting: false, // 投稿中の状態を追加
    });

    let threadState: Thread | null = $state({
        url: initialThread.url,
        title: initialThread.title ?? "",
        posts: initialThread.posts ?? [],
    });

    const loadThread = async (): Promise<void> => {
        const url = threadState?.url;

        if (!url) {
            log.warn("loadThread called with invalid URL.");
            viewState.error = "スレッドのURLが無効です。";
            return;
        }
        log.info("Loading thread...", { url });

        await handleAsyncOperation(() => bbsProvider.getThread(url), {
            onStart: () => {
                viewState.isLoading = true;
                viewState.error = null;
            },
            onSuccess: (threadData) => {
                log.debug("success", threadData);
                if (threadData) threadState = threadData;
            },
            onError: (error) => {
                viewState.error =
                    error.message || "スレッドの取得に失敗しました";
                // 取得失敗時に古いデータを残さないようにクリアする
                threadState = null;
            },
            onFinally: () => {
                viewState.isLoading = false;
            },
        });
    };

    const postMessage = async (
        postData: PostData
    ): Promise<SimpleOperationResult> => {
        const url = threadState?.url;
        if (!url) {
            const errorMsg = "投稿先のURLが無効です。";
            logger.warn(errorMsg);
            return { success: false, error: errorMsg };
        }

        let result: SimpleOperationResult = { success: false };

        await handleAsyncOperation(() => bbsProvider.post(url, postData), {
            onStart: () => {
                viewState.isSubmitting = true;
                viewState.error = null;
            },
            onSuccess: async (postResult) => {
                switch (postResult.kind) {
                    case "success":
                        result = { success: true };
                        await loadThread(); // 投稿成功後にスレッドを再読み込み
                        break;
                    case "error":
                        viewState.error = postResult.message;
                        result = { success: false, error: postResult.message };
                        break;
                    case "confirmation":
                        // 確認画面は現在未サポートのため、エラーとして扱う
                        const confirmError = `確認画面が必要です: ${postResult.message}`;
                        viewState.error = confirmError;
                        result = { success: false, error: confirmError };
                        break;
                }
            },
            onError: (error) => {
                viewState.error = error.message || "投稿に失敗しました";
                result = { success: false, error: viewState.error };
            },
            onFinally: () => {
                viewState.isSubmitting = false;
            },
        });
        return result;
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
        postMessage, // 返り値に追加
        updateAndLoadThread,
        setAutoReload: (enabled: boolean) => {
            viewState.autoReload = enabled;
        },
        setAutoScroll: (enabled: boolean) => {
            viewState.autoScroll = enabled;
        },
    };
}
