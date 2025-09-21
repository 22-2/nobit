import type { PostData, Thread } from "@repo/libch/core/types";
import type MyPlugin from "src/main";
import { BaseService, type OperationResult } from "./BaseService.svelte";
import { get } from "svelte/store";

export interface ThreadServiceState {
    thread: Thread | null;
    isLoading: boolean;
    error: string | null;
    autoReload: boolean;
    autoReloadInterval: number;
    autoScroll: boolean;
    // For post form
    postData: PostData | null;
    isInlineFormVisible: boolean;
    isConfirmationVisible: boolean;
    confirmationHtml: string;
    confirmationData: Record<string, string> | null;
    isSubmitting: boolean;
}

export class ThreadService extends BaseService<ThreadServiceState> {
    private autoReloadTimer: ReturnType<typeof setInterval> | null = null;

    constructor(plugin: MyPlugin, initialThread: Partial<Thread>) {
        const initialState: ThreadServiceState = {
            thread: {
                url: initialThread.url ?? "",
                title: initialThread.title ?? "",
                posts: initialThread.posts ?? [],
            } as Thread,
            isLoading: false,
            error: null,
            autoReload: false,
            autoReloadInterval: 30000,
            autoScroll: false,
            postData: null,
            isInlineFormVisible: false,
            isConfirmationVisible: false,
            confirmationHtml: "",
            confirmationData: null,
            isSubmitting: false,
        };

        super(plugin, "ThreadService", initialState);

        if (initialThread.url) {
            this.loadThread();
        }
    }

    async loadThread(options?: OperationResult<ThreadServiceState>) {
        const url = get(this.state).thread?.url;
        if (!url) {
            this.logger.warn("thread url is null");
            this.state.update((s) => ({
                ...s,
                error: "スレッドのURLが無効です。",
            }));
            return;
        }

        this.logger.info("loadThread", { url });

        this.stopAutoReloadTimer();

        await this.handleAsyncOperation(
            () => this.workerBBSProvider.getThread(url),
            {
                onStart: () => {
                    this.state.update((s) => ({
                        ...s,
                        isLoading: true,
                        error: null,
                    }));
                },
                onSuccess: (threadData) => {
                    if (threadData) {
                        this.state.update((s) => ({
                            ...s,
                            thread: threadData,
                        }));
                    }
                },
                onError: (error) => {
                    this.state.update((s) => ({
                        ...s,
                        error: error.message || "スレッドの取得に失敗しました",
                        thread: null,
                    }));
                },
                onFinally: () => {
                    this.state.update((s) => ({ ...s, isLoading: false }));
                    if (get(this.state).autoReload) {
                        this.startAutoReloadTimer();
                    }
                },
                errorMessage: "スレッドの取得に失敗しました",
            }
        );
    }

    updateUrl(thread: UpdateThreadArg) {
        if (get(this.state).thread?.url !== thread.url) {
            this.state.update((s) => ({ ...s, thread: thread as Thread }));
            this.loadThread();
        }
    }

    setAutoReload(enabled: boolean) {
        this.state.update((s) => ({ ...s, autoReload: enabled }));
        if (enabled) {
            this.startAutoReloadTimer();
        } else {
            this.stopAutoReloadTimer();
        }
    }

    setAutoScroll(enabled: boolean) {
        this.state.update((s) => ({ ...s, autoScroll: enabled }));
    }

    private startAutoReloadTimer() {
        this.stopAutoReloadTimer();
        this.autoReloadTimer = setInterval(
            () => this.loadThread(),
            get(this.state).autoReloadInterval
        );
    }

    private stopAutoReloadTimer() {
        if (this.autoReloadTimer) {
            clearInterval(this.autoReloadTimer);
            this.autoReloadTimer = null;
        }
    }

    destroy() {
        this.stopAutoReloadTimer();
    }

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    async post(postData: PostData, confirmationData?: Record<string, any>) {
        if (!confirmationData) {
            this.state.update((s) => ({ ...s, isSubmitting: true }));
        }

        const threadUrl = get(this.state).thread?.url;
        if (!threadUrl) {
            this.plugin.deps.notifier("スレッドのURLが取得できませんでした。");
            this.state.update((s) => ({ ...s, isSubmitting: false }));
            return;
        }

        const headers = {
            "User-Agent": "Monazilla/1.00 Siki/0.0.1",
        };

        const result = await this.plugin.deps.threadService.post(
            threadUrl,
            postData,
            headers,
            confirmationData
        );

        switch (result.kind) {
            case "success":
                this.plugin.deps.notifier("書き込みに成功しました。");
                this.state.update((s) => ({
                    ...s,
                    isInlineFormVisible: false,
                    isConfirmationVisible: false,
                    confirmationData: null,
                    confirmationHtml: "",
                    isSubmitting: false,
                }));
                await this.loadThread();
                break;
            case "error":
                this.plugin.deps.notifier(`書き込みエラー: ${result.message}`);
                this.plugin.deps.log(`書き込みエラー: `, result);
                this.state.update((s) => ({
                    ...s,
                    isConfirmationVisible: false,
                    isSubmitting: false,
                }));
                break;
            case "confirmation":
                this.state.update((s) => ({
                    ...s,
                    isConfirmationVisible: true,
                    confirmationHtml: result.html,
                    confirmationData: result.formData,
                }));
                break;
        }
    }

    showInlineForm() {
        this.state.update((s) => ({ ...s, isInlineFormVisible: true }));
    }

    hideInlineForm() {
        this.state.update((s) => ({ ...s, isInlineFormVisible: false }));
    }

    handleInitialPost = async (data: PostData) => {
        this.state.update((s) => ({ ...s, postData: data }));
        await this.post(data);
    };

    handleConfirmPost = async () => {
        const { postData, confirmationData } = get(this.state);
        if (postData && confirmationData) {
            await this.post(postData, confirmationData);
        }
    };

    handleCancelConfirmation = () => {
        this.state.update((s) => ({
            ...s,
            isConfirmationVisible: false,
            confirmationData: null,
            confirmationHtml: "",
            isSubmitting: false, // Also reset submitting state on cancel
            postData: null,
        }));
    };
}
export type UpdateThreadArg = Omit<Thread, "url"> & {
    url: string;
};
