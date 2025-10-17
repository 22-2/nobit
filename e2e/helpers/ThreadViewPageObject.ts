import { expect, type Page } from "@playwright/test";
import { VIEW_TYPE_THREAD } from "../constants";
import {
	ObsidianPageObject,
	type PageObjectConfig,
} from "./ObsidianPageObject";
import type { VaultPageTextContext } from "./types";

/**
 * ThreadView専用のテストヘルパークラス
 * Single Responsibility: ThreadViewのテスト操作のみを担当
 */
export class ThreadViewPageObject extends ObsidianPageObject {
	constructor(
		page: Page,
		pluginHandleMap?: VaultPageTextContext["pluginHandleMap"],
		config: PageObjectConfig = { viewType: VIEW_TYPE_THREAD },
	) {
		super(page, pluginHandleMap, config);
	}

	/**
	 * ThreadViewを開いて基本的な検証を行う
	 */
	async openAndVerifyThreadView(
		pluginId: string,
		url: string,
	): Promise<void> {
		await this.openPluginWithURL(pluginId, url);
		// Wait for the view to be created before checking count
		await this.page.waitForFunction(
			(viewType) => app.workspace.getLeavesOfType(viewType).length > 0,
			VIEW_TYPE_THREAD,
			{ timeout: 5000 },
		);
		await this.expectViewCount(VIEW_TYPE_THREAD, 1);
		await this.expectActiveTabType(VIEW_TYPE_THREAD);
		await expect(this.page.locator(".thread-view")).toBeVisible();
	}

	/**
	 * スレッドコンテンツの読み込みを待機（アクティブなリーフのみ）
	 */
	async waitForThreadContent(timeout = 15000): Promise<void> {
		await expect(
			this.page.locator(".workspace-leaf.mod-active .thread-content"),
		).toBeVisible({
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
			".toolbar-section .clickable-icon",
		);
		await expect(refreshButton).toBeVisible();
		await refreshButton.click({ force: true });
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
	 * ThreadView専用のフィルター操作
	 */
	async applyThreadSearchFilter(searchText: string): Promise<void> {
		await this.applySearchFilter(
			searchText,
			'.thread-filters input[type="text"]',
		);
	}

	async clearThreadSearchFilter(): Promise<void> {
		await this.clearSearchFilter('.thread-filters input[type="text"]');
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
		const titleBar = await this.getTabHeaderText();
		const threadHeader = await this.getThreadHeaderTitle();
		const state = await this.getThreadManagerState();
		const managerState = state?.threadTitle || null;

		const allMatch =
			titleBar === threadHeader && threadHeader === managerState;

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
