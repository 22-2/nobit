import type { UViewState, Workspace, WorkspaceLeaf } from "obsidian";
import { type ParsedBbsUrl, parseBbsUrl } from "src/lib/libch/url";
import { VIEW_TYPE_THREAD } from "./constants";

export async function activateView<T = any, U = any>(
	getLeaf: Workspace["getLeaf"],
	viewState: UViewState,
	eState?: U,
): Promise<T> {
	const leaf: WorkspaceLeaf = getLeaf("tab");

	if (viewState) {
		await leaf.setViewState(viewState);
	}
	if (eState) {
		leaf.setEphemeralState(eState);
	}

	return leaf.view as T;
}
interface ViewResult {
	type: string;
	state: ParsedBbsUrl;
	active: boolean;
}
interface OpenWithUrlOptions {
	viewType?: "normal";
}
function createThreadViewState(result: any, viewType: "normal"): ViewResult {
	const state = {
		...result,
		title: result.threadId, // 初期タイトルとしてスレッドIDを使用
	};

	return createViewState(VIEW_TYPE_THREAD, state);
}
// ビュー生成のヘルパー関数

export function createViewState(type: string, state: ParsedBbsUrl): ViewResult {
	return {
		type,
		state: { ...state, type },
		active: true,
	};
}

export function getViewStateByUrl(
	url: string,
	log: (message: string) => void,
	options?: OpenWithUrlOptions,
): ViewResult | void {
	const result = parseBbsUrl(url);

	if (!result?.board) {
		log("Invalid URL");
		return;
	}
	// 掲示板ビューの場合
	// if (!result.threadId) {
	// 	return createBoardViewState(result.board, result.host);
	// }
	// スレッドビューの場合
	// スレッド情報を事前に取得せず、ビューを即座に開く
	// ビュー自体がデータの読み込みとタイトルの更新を担当する
	return createThreadViewState(result, options?.viewType!);
}

export function isURL(url: string | null | undefined) {
	try {
		new URL(url!);
		return true;
	} catch {
		return false;
	}
}
