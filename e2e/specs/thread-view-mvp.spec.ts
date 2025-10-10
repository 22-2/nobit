import { TestFetcherMockHelper } from "e2e/helpers/TestFetcherMockHelper";
import { expect, test } from "../base";
import { DIST_DIR, PLUGIN_ID, SANDBOX_VAULT_NAME } from "../constants";
import { MockDataFactory } from "../helpers/MockDataFactory";
import { ObsidianPageObject } from "../helpers/ObsidianPageObject";
import { ThreadViewTestHelper } from "../helpers/ThreadViewTestHelper";

/**
 * MVP基本機能テスト
 * SOLID原則に基づいてリファクタリング済み
 */
test.describe("Thread View MVP Tests", () => {
	test("should open ThreadView via command", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(
			vault.window,
			vault.pluginHandleMap
		);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// Verify initial setup
		const vaultName = await vault.window.evaluate(() => app.vault.getName());
		expect(vaultName).toBe(SANDBOX_VAULT_NAME);

		const plugin = await vault.window.evaluate(
			(pluginId) => app.plugins.getPlugin(pluginId),
			PLUGIN_ID
		);
		expect(plugin).toBeTruthy();

		// Setup mock
		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createBasicThreadData()
		});

		// Open ThreadView
		await threadHelper.openAndVerifyThreadView(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/"
		);

		// Verify content loaded
		await threadHelper.waitForThreadContent(10000);
		await threadHelper.verifyBasicUIStructure();

		// Verify posts
		const postCount = await threadHelper.getPostCount();
		expect(postCount).toBeGreaterThan(0);

		// Verify no errors
		await threadHelper.verifyErrorState(false);
		await threadHelper.verifyLoadingState(false);
	});

	test("should display UI structure correctly", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(
			vault.window,
			vault.pluginHandleMap
		);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// Setup mock
		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createBasicThreadData()
		});

		// Open ThreadView
		await threadHelper.openAndVerifyThreadView(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/"
		);

		// Verify UI structure
		await threadHelper.waitForThreadContent(10000);
		await threadHelper.verifyBasicUIStructure();

		// Verify interactive elements
		await expect(
			vault.window.locator(".toolbar-section .clickable-icon")
		).toBeVisible();

		// Verify successful load
		await threadHelper.verifyErrorState(false);
		await threadHelper.verifyLoadingState(false);
	});

	test("should support Svelte 5 reactivity", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(
			vault.window,
			vault.pluginHandleMap
		);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// Setup mock
		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createBasicThreadData()
		});

		// Open ThreadView
		await threadHelper.openAndVerifyThreadView(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/"
		);

		await threadHelper.waitForThreadContent(10000);

		// Verify reactive components
		await expect(vault.window.locator(".thread-filters")).toBeVisible();
		await expect(
			vault.window.locator(".filter-buttons-group")
		).toBeVisible();
		await expect(vault.window.locator(".thread-title")).toBeVisible();
		await expect(vault.window.locator(".post-count")).toContainText("posts");

		// Verify posts (reactive state)
		const postCount = await threadHelper.getPostCount();
		expect(postCount).toBeGreaterThan(0);

		// Verify interactive elements
		await expect(
			vault.window.locator(".toolbar-section .clickable-icon")
		).toBeVisible();
	});

	test("should maintain architectural separation", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(
			vault.window,
			vault.pluginHandleMap
		);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// Setup mock
		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createBasicThreadData()
		});

		// Open ThreadView
		await threadHelper.openAndVerifyThreadView(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/"
		);

		await threadHelper.waitForThreadContent(10000);

		// Verify Svelte components work (no 'obsidian' imports)
		await expect(vault.window.locator(".thread-view")).toBeVisible();
		await expect(vault.window.locator(".thread-filters")).toBeVisible();
		await expect(vault.window.locator(".posts-container")).toBeVisible();

		// Verify Manager → Svelte communication
		await expect(vault.window.locator(".thread-title")).toBeVisible();
		await expect(vault.window.locator(".post-count")).toContainText("posts");

		// Verify existing components integrate
		await expect(vault.window.locator(".toolbar-section")).toBeVisible();
		await expect(vault.window.locator(".filters-section")).toBeVisible();
	});

	test("should validate basic UI structure", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(
			vault.window,
			vault.pluginHandleMap
		);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// Setup mock
		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createBasicThreadData()
		});

		// Open ThreadView
		await threadHelper.openAndVerifyThreadView(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/"
		);

		await threadHelper.waitForThreadContent(10000);

		// Verify all sections
		await expect(vault.window.locator(".thread-view")).toBeVisible();
		await expect(vault.window.locator(".filters-section")).toBeVisible();
		await expect(vault.window.locator(".toolbar-section")).toBeVisible();
		await expect(vault.window.locator(".thread-header")).toBeVisible();
		await expect(vault.window.locator(".thread-title")).toBeVisible();
		await expect(vault.window.locator(".posts-container")).toBeVisible();

		// Verify posts
		const postCount = await threadHelper.getPostCount();
		expect(postCount).toBeGreaterThan(0);

		// Verify interactive elements
		await expect(
			vault.window.locator(".toolbar-section .clickable-icon")
		).toBeVisible();

		// Verify filter components
		await expect(vault.window.locator(".thread-filters")).toBeVisible();
		await expect(
			vault.window.locator(".filter-buttons-group")
		).toBeVisible();
	});
});

test.use({
	vaultOptions: {
		useSandbox: true,
		plugins: [
			{
				path: DIST_DIR,
				pluginId: PLUGIN_ID,
			},
		],
	},
});
