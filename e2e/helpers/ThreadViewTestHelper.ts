import { expect, type Page } from "@playwright/test";
import { VIEW_TYPE_THREAD } from "../../src/utils/constants";
import type { ObsidianPageObject } from "./ObsidianPageObject";

/**
 * ThreadView専用のテストヘルパークラス
 * Single Responsibility: ThreadViewのテスト操作のみを担当
 */
export class ThreadViewTestHelper {
	constructor(
		private readonly page: Page,
		private readonly obsPage: ObsidianPageObject
	) {}

	/**
	 * ThreadViewを開いて基本的な検証を行う
	 */
	async openAndVerifyThreadView(pluginId: string, url: string): Promise<void> {
		await this.obsPage.openPluginWithURL(pluginId, url);
		await this.obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);
		await this.obsPage.expectActiveTabType(VIEW_TYPE_THREAD);
		await expect(this.page.locator(".thread-view")).toBeVisible();
	}

	/**
	 * スレッドコンテンツの読み込みを待機（アクティブなリーフのみ）
	 */
	async waitForThreadContent(timeout = 15000): Promise<void> {
		await expect(this.page.locator(".workspace-leaf.mod-active .thread-content")).toBeVisible({
			timeout,
		});
	}

	/**
	 * UI構造の基本検証
	 */
	async verifyBasicUIStructure(): Promise<void> {
		await expect(this.page.locator(".thread-header")).toBeVisible();
		await expect(this.page.locator(".thread-title")).toBeVisible();
		await expect(this.page.locator(".posts-container")).toBeVisible();
		await expect(this.page.locator(".filters-section")).toBeVisible();
		await expect(this.page.locator(".toolbar-section")).toBeVisible();
	}

	/**
	 * 投稿数を取得
	 */
	async getPostCount(): Promise<number> {
		return await this.page.locator(".posts-container .post").count();
	}

	/**
	 * ThreadManagerの状態を取得
	 */
	async getThreadManagerState(): Promise<ThreadManagerState | null> {
		return await this.page.evaluate(() => {
			const activeLeaf = app.workspace.activeLeaf;
			if (activeLeaf && activeLeaf.view.getViewType() === "thread-view") {
				const threadView = activeLeaf.view as any;
				const threadManager = threadView.threadManager;
				return {
					hasThread: !!threadManager.thread,
					threadPostsLength: threadManager.thread?.posts?.length || 0,
					threadTitle: threadManager.thread?.title || null,
					threadUrl: threadManager.thread?.url || null,
					isLoading: threadManager.isLoading,
					error: threadManager.error,
					filtersInitialized: !!threadManager.filters,
				};
			}
			return null;
		});
	}

	/**
	 * リフレッシュボタンをクリック
	 */
	async clickRefreshButton(): Promise<void> {
		const refreshButton = this.page.locator(
			".toolbar-section .clickable-icon"
		);
		await expect(refreshButton).toBeVisible();
		await refreshButton.click({ force: true });
	}

	/**
	 * エラー状態を検証
	 */
	async verifyErrorState(shouldBeVisible: boolean): Promise<void> {
		if (shouldBeVisible) {
			await expect(this.page.locator(".error-container")).toBeVisible({
				timeout: 5000,
			});
		} else {
			await expect(this.page.locator(".error-container")).not.toBeVisible();
		}
	}

	/**
	 * ローディング状態を検証
	 */
	async verifyLoadingState(shouldBeVisible: boolean): Promise<void> {
		if (shouldBeVisible) {
			await expect(this.page.locator(".loading-container")).toBeVisible();
		} else {
			await expect(this.page.locator(".loading-container")).not.toBeVisible();
		}
	}

	/**
	 * ThreadViewを閉じる
	 */
	async closeThreadView(): Promise<void> {
		await this.page.evaluate(() => {
			const activeLeaf = app.workspace.activeLeaf;
			if (activeLeaf && activeLeaf.view.getViewType() === "thread-view") {
				activeLeaf.detach();
			}
		});
		await this.page.waitForTimeout(1000);
	}

	/**
	 * フィルター操作のヘルパー
	 */
	async applySearchFilter(searchText: string): Promise<void> {
		const searchInput = this.page.locator(
			'.thread-filters input[type="text"]'
		);
		await searchInput.fill(searchText);
		await this.page.waitForTimeout(300);
	}

	async clearSearchFilter(): Promise<void> {
		const searchInput = this.page.locator(
			'.thread-filters input[type="text"]'
		);
		await searchInput.clear();
		await this.page.waitForTimeout(200);
	}

	/**
	 * パフォーマンス測定用のヘルパー
	 */
	async measureLoadTime(action: () => Promise<void>): Promise<number> {
		const startTime = Date.now();
		await action();
		return Date.now() - startTime;
	}

	/**
	 * タイトルバーのタイトルを取得（アクティブなリーフのみ）
	 */
	async getTitleBarText(): Promise<string | null> {
		return await this.page.locator(".workspace-leaf.mod-active .view-header-title").textContent();
	}

	/**
	 * タイトルバーのタイトルを取得（アクティブなリーフのみ）
	 */
	async getTabHeaderText(): Promise<string | null> {
		return await this.page.locator(".workspace-tab-header.mod-active .workspace-tab-header-inner").textContent();
	}

	/**
	 * スレッドヘッダーのタイトルを取得
	 */
	async getThreadHeaderTitle(): Promise<string | null> {
		return await this.page.locator(".thread-title").textContent();
	}

	/**
	 * タイトルが一致することを検証
	 */
	async verifyTitleConsistency(): Promise<{
		titleBar: string | null;
		threadHeader: string | null;
		managerState: string | null;
		allMatch: boolean;
	}> {
		const titleBar = await this.getTitleBarText();
		const threadHeader = await this.getThreadHeaderTitle();
		const state = await this.getThreadManagerState();
		const managerState = state?.threadTitle || null;

		const allMatch = titleBar === threadHeader && threadHeader === managerState;

		return {
			titleBar,
			threadHeader,
			managerState,
			allMatch,
		};
	}
}

export interface ThreadManagerState {
	hasThread: boolean;
	threadPostsLength: number;
	threadTitle: string | null;
	threadUrl: string | null;
	isLoading: boolean;
	error: any;
	filtersInitialized: boolean;
}
