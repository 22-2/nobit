import { App, Notice, WorkspaceLeaf } from "obsidian";
import { parseBbsUrl } from "@nobit/libch/core/url";
import { VIEW_TYPES } from "./constants";

export function notify(message: string, ms = 750) {
    return new Notice(message, ms);
}

/**
 * Open your view on the chosen `side` if it isn't already open
 * @param  {string} viewType
 * @param  {Constructor<YourState>} viewClass The class constructor of your view
 * @param  {"left"|"right"} [side="right"]
 * @returns {Promise<YourState>} The opened view
 */

export async function activateView<T = any, U = any>(
    app: App,
    viewState: ViewState,
    eState?: U
): Promise<T> {
    const leaf: WorkspaceLeaf = app.workspace.getLeaf("tab");

    if (viewState) {
        await leaf.setViewState(viewState);
    }
    if (eState) {
        leaf.setEphemeralState(eState);
    }

    return leaf.view as T;
}

// 型定義
interface ViewState {
    type: string;
    board: string;
    title: string;
    threadId?: string;
}

interface ViewResult {
    type: string;
    state: ViewState;
    active: boolean;
}

// ビュー生成のヘルパー関数
export function createView(type: string, state: ViewState): ViewResult {
    return {
        type,
        state: { ...state, type },
        active: true,
    };
}

interface OpenWithUrlOptions {
    viewType?: "normal" | "live";
}

function createBoardView(board: string): ViewResult {
    return createView(VIEW_TYPES.BOARD, {
        type: VIEW_TYPES.BOARD,
        board,
        title: board,
    });
}

function createThreadView(
    result: any,
    viewType: "normal" | "live" = "normal"
): ViewResult {
    const state = {
        ...result,
        title: result.threadId, // 初期タイトルとしてスレッドIDを使用
    };

    const type = viewType === "live" ? VIEW_TYPES.LIVE_CHAT : VIEW_TYPES.THREAD;

    return createView(type, state);
}

export async function openWithUrl(
    url: string,
    log: (message: string) => void,
    options?: OpenWithUrlOptions
): Promise<ViewResult | void> {
    const result = parseBbsUrl(url);

    if (!result?.board) {
        log("Invalid URL");
        return;
    }

    // 掲示板ビューの場合
    if (!result.threadId) {
        return createBoardView(result.board);
    }

    // スレッドビューの場合
    // スレッド情報を事前に取得せず、ビューを即座に開く
    // ビュー自体がデータの読み込みとタイトルの更新を担当する
    return createThreadView(result, options?.viewType);
}
