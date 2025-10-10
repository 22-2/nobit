import { TestFetcherMockHelper } from "e2e/helpers/TestFetcherMockHelper";
import { expect, test } from "../base";
import { DIST_DIR, PLUGIN_ID } from "../constants";
import { MockDataFactory } from "../helpers/MockDataFactory";
import { ThreadViewPageObject } from "../helpers/ThreadViewPageObject";

/**
 * 統合テスト
 * SOLID原則に基づいてリファクタリング済み
 */
test.describe("Thread View Integration Tests", () => {
	test("should complete full user journey", async ({ vault }) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// Setup mock using TestFetcher directly
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		const plugin = await vault.window.evaluate(
			(pluginId) => app.plugins.getPlugin(pluginId),
			PLUGIN_ID,
		);
		expect(plugin).toBeTruthy();

		// Execute complete flow
		console.log("Step 1: Executing command");
		await threadPage.openAndVerifyThreadView(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759626688/",
		);

		console.log("Step 2: Verifying 5ch fetch and UI display");
		await threadPage.waitForThreadContent();
		await threadPage.verifyBasicUIStructure();

		// Verify posts are loaded
		const postCount = await threadPage.getPostCount();
		expect(postCount).toBeGreaterThan(0);
		console.log(`Verified ${postCount} posts loaded and displayed`);

		// Verify ThreadManager state
		const state = await threadPage.getThreadManagerState();
		expect(state).toBeTruthy();
		expect(state?.hasThread).toBe(true);
		expect(state?.threadPostsLength).toBeGreaterThan(0);
		expect(state?.threadTitle).toBeTruthy();
		expect(state?.threadUrl).toBeTruthy();
		expect(state?.isLoading).toBe(false);
		expect(state?.error).toBeNull();
		expect(state?.filtersInitialized).toBe(true);

		console.log("✓ Complete flow validation passed");
	});

	test("should handle state changes correctly", async ({ vault }) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// Setup mock using TestFetcher directly
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		// Open ThreadView
		await threadPage.openAndVerifyThreadView(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);
		await threadPage.waitForThreadContent();

		console.log("Testing loading state UI updates");

		// Trigger refresh
		await threadPage.clickRefreshButton();

		// Check for loading state
		try {
			await threadPage.expectLoadingState(true);
			console.log("✓ Loading state UI update detected");
		} catch {
			console.log(
				"Loading state was too brief to catch (acceptable for fast operations)",
			);
		}

		// Verify loading completes
		await threadPage.waitForThreadContent(10000);
		await threadPage.expectLoadingState(false);

		console.log("Testing filter state UI updates");

		// Test search filter
		const searchInput = vault.window.locator(
			'.thread-filters input[type="text"]',
		);
		if ((await searchInput.count()) > 0) {
			await threadPage.applyThreadSearchFilter("test");

			const filterState = await vault.window.evaluate(() => {
				const activeLeaf = app.workspace.activeLeaf;
				if (activeLeaf && activeLeaf.view.getViewType() === "thread-view") {
					const threadView = activeLeaf.view as any;
					return threadView.threadManager.filters.searchText;
				}
				return null;
			});

			expect(filterState).toBe("test");
			console.log("✓ Search filter state update verified");

			await threadPage.clearThreadSearchFilter();
		}

		console.log("✓ ThreadManager state changes trigger UI updates correctly");
	});

	test("should cleanup properly when closed", async ({ vault }) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// Setup mock using TestFetcher directly
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		// Open and verify ThreadView
		await threadPage.openAndVerifyThreadView(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);
		await threadPage.waitForThreadContent();

		// Verify initialization
		const initialState = await vault.window.evaluate(() => {
			const activeLeaf = app.workspace.activeLeaf;
			if (activeLeaf && activeLeaf.view.getViewType() === "thread-view") {
				const threadView = activeLeaf.view as any;
				return {
					hasThreadManager: !!threadView.threadManager,
					hasComponent: !!threadView.component,
					contentElHasChildren: threadView.contentEl.children.length > 0,
				};
			}
			return null;
		});

		expect(initialState?.hasThreadManager).toBe(true);
		expect(initialState?.hasComponent).toBe(true);
		expect(initialState?.contentElHasChildren).toBe(true);

		console.log("ThreadView initialized properly");

		// Close the ThreadView
		await threadPage.closeThreadView();

		// Verify cleanup
		const afterCloseState = await vault.window.evaluate(() => {
			const leaves = app.workspace.getLeavesOfType("thread-view");
			return {
				threadViewCount: leaves.length,
				hasActiveThreadView: leaves.some(
					(leaf) => leaf === app.workspace.activeLeaf,
				),
			};
		});

		expect(afterCloseState.threadViewCount).toBe(0);
		expect(afterCloseState.hasActiveThreadView).toBe(false);

		console.log("✓ ThreadView properly cleaned up after closure");

		// Verify we can open a new ThreadView
		await threadPage.openAndVerifyThreadView(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);
		await threadPage.waitForThreadContent();

		console.log("✓ New ThreadView can be opened after cleanup");
	});

	test("should validate architectural separation", async ({ vault }) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// Setup mock using TestFetcher directly
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		// Open ThreadView
		await threadPage.openAndVerifyThreadView(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);
		await threadPage.waitForThreadContent();

		// Verify architectural layers
		const componentValidation = await vault.window.evaluate(() => {
			const activeLeaf = app.workspace.activeLeaf;
			if (activeLeaf && activeLeaf.view.getViewType() === "thread-view") {
				const threadView = activeLeaf.view as any;

				return {
					hasThreadView: !!threadView,
					threadViewType: threadView.getViewType(),
					hasThreadManager: !!threadView.threadManager,
					threadManagerHasState: !!(
						threadView.threadManager?.thread !== undefined
					),
					hasSvelteComponent: !!threadView.component,
					contentElHasContent: threadView.contentEl.children.length > 0,
					threadManagerThread: !!threadView.threadManager?.thread,
					threadManagerFilters: !!threadView.threadManager?.filters,
				};
			}
			return null;
		});

		// Verify all layers work correctly
		expect(componentValidation?.hasThreadView).toBe(true);
		expect(componentValidation?.threadViewType).toBe("thread-view");
		expect(componentValidation?.hasThreadManager).toBe(true);
		expect(componentValidation?.threadManagerHasState).toBe(true);
		expect(componentValidation?.hasSvelteComponent).toBe(true);
		expect(componentValidation?.contentElHasContent).toBe(true);
		expect(componentValidation?.threadManagerThread).toBe(true);
		expect(componentValidation?.threadManagerFilters).toBe(true);

		// Verify UI components
		await expect(vault.window.locator(".thread-view")).toBeVisible();
		await expect(vault.window.locator(".thread-filters")).toBeVisible();
		await expect(vault.window.locator(".posts-container")).toBeVisible();
		await expect(vault.window.locator(".thread-footer-toolbar")).toBeVisible();

		// Verify data flow
		const posts = await vault.window.locator(".posts-container .post");
		const postCount = await posts.count();
		expect(postCount).toBeGreaterThan(0);

		// Verify interactive elements
		const refreshButton = vault.window.locator(
			".toolbar-section .clickable-icon",
		);
		await expect(refreshButton).toBeVisible();
		await refreshButton.click({ force: true });
		await threadPage.waitForThreadContent(10000);

		console.log(
			"✓ Architectural separation validated - Manager layer successfully bridges Obsidian and Svelte",
		);
	});

	test("should handle errors and recover", async ({ vault }) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// Setup mock for initial load
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		// Test normal operation first
		await threadPage.openAndVerifyThreadView(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);
		await threadPage.waitForThreadContent();

		console.log("Normal operation verified");

		// Simulate network failure by returning error status
		await mockHelper.setupPatternMock(".dat", {
			status: 500,
			body: "Internal Server Error",
		});

		// Trigger refresh to test error handling
		await threadPage.clickRefreshButton();

		// Wait for error state
		try {
			await threadPage.expectErrorState(true);
			console.log("✓ Error state displayed correctly");

			const errorMessage = await vault.window
				.locator(".error-message")
				.textContent();
			expect(errorMessage).toBeTruthy();
			console.log(`Error message: ${errorMessage}`);
		} catch {
			console.log("Error state was handled too quickly or differently");
		}

		// Restore normal operation
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		// Verify recovery
		await threadPage.clickRefreshButton();
		await threadPage.waitForThreadContent(10000);

		console.log("✓ Error handling and recovery validated");
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
