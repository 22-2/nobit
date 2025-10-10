import type { Page } from "@playwright/test";
import { DIST_DIR, PLUGIN_ID } from "../constants";
import { MockDataFactory } from "./MockDataFactory";
import { TestFetcherMockHelper } from "./TestFetcherMockHelper";
import { ThreadViewPageObject } from "./ThreadViewPageObject";
import type { VaultPageTextContext } from "./types";

/**
 * Base test setup class following Single Responsibility Principle
 * Handles common test initialization and cleanup
 */
export class BaseTestSetup {
	protected threadPage: ThreadViewPageObject;
	protected mockHelper: TestFetcherMockHelper;
	protected window: Page;

	constructor(vault: VaultPageTextContext) {
		this.window = vault.window;
		this.threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		this.mockHelper = new TestFetcherMockHelper(vault.window);
	}

	/**
	 * Setup basic thread with default mock data
	 */
	async setupBasicThread(url?: string): Promise<string> {
		await this.mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		const threadUrl =
			url || "http://bbs.eddibb.cc/test/read.cgi/liveedge/1759626688/";
		await this.threadPage.openAndVerifyThreadView(PLUGIN_ID, threadUrl);
		await this.threadPage.waitForThreadContent();

		return threadUrl;
	}

	/**
	 * Setup thread with custom data
	 */
	async setupCustomThread(
		options: { title?: string; postCount?: number; url?: string } = {},
	): Promise<string> {
		await this.mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: options.title || "テストスレッド",
				postCount: options.postCount || 10,
			}),
		});

		const threadUrl =
			options.url || "http://bbs.eddibb.cc/test/read.cgi/liveedge/1759626688/";
		await this.threadPage.openAndVerifyThreadView(PLUGIN_ID, threadUrl);
		await this.threadPage.waitForThreadContent();

		return threadUrl;
	}

	/**
	 * Setup large thread for performance testing
	 */
	async setupLargeThread(postCount = 1000, url?: string): Promise<string> {
		await this.mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createLargeThreadData(postCount),
		});

		const threadUrl =
			url || "http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/";
		await this.threadPage.openAndVerifyThreadView(PLUGIN_ID, threadUrl);
		await this.threadPage.waitForThreadContent();

		return threadUrl;
	}

	/**
	 * Get thread page object
	 */
	getThreadPage(): ThreadViewPageObject {
		return this.threadPage;
	}

	/**
	 * Get mock helper
	 */
	getMockHelper(): TestFetcherMockHelper {
		return this.mockHelper;
	}

	/**
	 * Get window
	 */
	getWindow(): Page {
		return this.window;
	}
}

/**
 * Default test configuration for reuse
 */
export const DEFAULT_TEST_CONFIG = {
	vaultOptions: {
		useSandbox: true,
		showLoggerOnNode: true,
		plugins: [
			{
				path: DIST_DIR,
				pluginId: PLUGIN_ID,
			},
		],
	},
};
