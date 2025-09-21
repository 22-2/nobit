import type { Menu, MenuItem } from "obsidian";
import type MyPlugin from "src/main";
import { WorkerBBSProvider } from "src/providers/WorkerBBSProvider";
import { Logger } from "src/utils/logging";
import { writable, type Writable } from "svelte/store";

export type OperationResult<T = any> = {
    loadingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
    onStart?: () => void;
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
    onFinally?: () => void;
};

export abstract class BaseService<TState> {
    protected plugin: MyPlugin;
    protected workerBBSProvider = new WorkerBBSProvider();
    protected logger: ReturnType<typeof Logger.getSubLogger>;

    state: Writable<TState>;

    constructor(plugin: MyPlugin, loggerName: string, initialState: TState) {
        this.plugin = plugin;
        this.logger = Logger.getSubLogger({ name: loggerName });
        this.state = writable(initialState);
    }

    /**
     * 非同期処理の共通エラーハンドリング
     */
    protected async handleAsyncOperation<T>(
        operation: () => Promise<T>,
        options: OperationResult<T> = {}
    ): Promise<T | null> {
        const {
            loadingMessage = "更新しています...",
            successMessage = "更新しました！",
            errorMessage = "操作に失敗しました",
            onStart,
            onSuccess,
            onError,
            onFinally,
        } = options;

        try {
            onStart?.();
            this.plugin.deps.notifier(loadingMessage);

            const result = await operation();

            this.plugin.deps.notifier(successMessage);
            onSuccess?.(result);
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            const message = error.message || errorMessage;

            this.logger.error(errorMessage, error);
            this.plugin.deps.notifier(message);
            onError?.(error);
            return null;
        } finally {
            onFinally?.();
        }
    }

    /**
     * URLから情報を抽出するヘルパーメソッド
     */
    protected parseUrl(
        url: string
    ): { host: string; board: string; threadId?: string } | null {
        try {
            const urlObj = new URL(url);
            const host = urlObj.hostname;
            const pathParts = urlObj.pathname.split("/").filter(Boolean);

            // test/read.cgi形式の場合
            if (pathParts.includes("test") && pathParts.includes("read.cgi")) {
                const readIndex = pathParts.indexOf("read.cgi");
                const board = pathParts[readIndex + 1];
                const threadId = pathParts[readIndex + 2];
                return { host, board, threadId };
            }

            // 通常の板URL形式
            const board = pathParts[0];
            if (!host || !board) {
                throw new Error("Invalid URL structure");
            }

            return { host, board };
        } catch (error) {
            this.logger.error("Invalid URL:", url, error);
            return null;
        }
    }

    protected addContextMenuItem(
        menu: Menu,
        title: string,
        icon: string,
        onClick: () => void
    ) {
        menu.addItem((item: MenuItem) =>
            item.setTitle(title).setIcon(icon).onClick(onClick)
        );
    }
}
