import type { ItemView, UViewState, Workspace, WorkspaceLeaf } from "obsidian";
import { type ParsedBbsUrl, parseBbsUrl } from "src/lib/libch/url";
import { VIEW_TYPE_BOARD, VIEW_TYPE_THREAD } from "./constants";

// ============================================================
// 型定義
// ============================================================

/**
 * Obsidianビューの状態を表すオブジェクト
 */
interface CreatedBaseViewState {
	/** ビューのタイプ */
	type: string;
	/** パース済みBBS URL情報 */
	state: ParsedBbsUrl;
	/** ビューをアクティブにするかどうか */
	active: boolean;
}

// ============================================================
// URL関連のユーティリティ
// ============================================================

/**
 * 文字列が有効なURLかどうかを判定する
 * @param url - 検証する文字列
 * @returns 有効なURLの場合true、それ以外false
 */
export function isURL(url: string | null | undefined): boolean {
	try {
		new URL(url!);
		return true;
	} catch {
		return false;
	}
}

/**
 * URLからビュー状態を生成する
 * @param url - パース対象のURL
 * @param log - エラーログ出力関数
 * @returns パース成功時はビュー状態、失敗時はundefined
 */
export function getViewStateByUrl(
	url: string,
	log: (message: string) => void,
): CreatedBaseViewState | undefined {
	const result = parseBbsUrl(url);

	if (!result?.board) {
		log("Invalid URL");
		return undefined;
	}

	const { threadId, board } = result;
	const title = threadId ? threadId : board;

	if (!threadId) {
		return createViewState(VIEW_TYPE_BOARD, result, title);
	}
	return createViewState(VIEW_TYPE_THREAD, result, title);
}

// ============================================================
// ビュー状態生成
// ============================================================


/**
 * 汎用的なビュー状態を生成する
 * @param type - ビューのタイプ
 * @param state - パース済みBBS URL情報
 * @returns ビュー状態オブジェクト
 */
function createViewState(type: string, parsedUrl: ParsedBbsUrl, title: string): CreatedBaseViewState {
	return {
		type,
		state: { ...parsedUrl, title },
		active: true,
	};
}

// ============================================================
// ビュー操作
// ============================================================

/**
 * 新しいタブでビューをアクティブ化する
 * @param getLeaf - Obsidianのリーフ取得関数
 * @param viewState - 設定するビューの状態
 * @param ephemeralState - 一時的な状態（オプション）
 * @returns アクティブ化されたビュー
 */
export async function activateView<TView extends ItemView, TEphemeralState = unknown>(
	getLeaf: Workspace["getLeaf"],
	viewState: UViewState,
	ephemeralState?: TEphemeralState,
): Promise<TView> {
	const leaf: WorkspaceLeaf = getLeaf("tab");

	if (viewState) {
		await leaf.setViewState(viewState);
	}
	if (ephemeralState) {
		leaf.setEphemeralState(ephemeralState);
	}

	return leaf.view as TView;
}

/**
 * ビューの現在の状態を履歴に記録する
 * @param view - 状態を記録するビュー
 */
export function recordPrevState<TView extends ItemView>(view: TView): void {
	const currentState = {
		state: view.getState(),
		eState: view.getEphemeralState(),
		icon: view.getIcon(),
		title: view.getDisplayText(),
		type: view.getViewType(),
	};

	// Obsidian内部APIを使用して履歴に記録
	(view.leaf as any).recordHistory({
		state: currentState,
		eState: currentState.eState,
		icon: currentState.icon,
		title: currentState.title,
	});
}

