import { TestFetcherMockHelper } from "e2e/helpers/TestFetcherMockHelper";
import { expect, test } from "../base";
import { DIST_DIR, PLUGIN_ID, SANDBOX_VAULT_NAME } from "../constants";
import { MockDataFactory } from "../helpers/MockDataFactory";
import { ObsidianPageObject } from "../helpers/ObsidianPageObject";
import { PerformanceTestHelper } from "../helpers/PerformanceTestHelper";
import { ThreadViewTestHelper } from "../helpers/ThreadViewTestHelper";

/**
 * パフォーマンステスト
 * SOLID原則に基づいてリファクタリング済み
 */
test.describe("Thread View Performance Tests", () => {
	test("should handle current thread data smoothly", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);
		const perfHelper = new PerformanceTestHelper(vault.window);

		// Setup mock with factory
		const mockData = MockDataFactory.createLargeThreadData(500);
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: mockData,
		});

		// Measure load time
		const loadTime = await perfHelper.measureExecutionTime(async () => {
			await threadHelper.openAndVerifyThreadView(
				PLUGIN_ID,
				"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
			);
			await threadHelper.waitForThreadContent();
		});

		console.log(`Thread load time: ${loadTime}ms`);

		// Verify posts are loaded
		const postCount = await threadHelper.getPostCount();
		console.log(`Loaded post count: ${postCount}`);
		expect(postCount).toBeGreaterThan(0);

		// Verify UI structure
		await threadHelper.verifyBasicUIStructure();

		// Performance should be reasonable
		expect(loadTime).toBeLessThan(10000);

		// Verify ThreadManager state
		const state = await threadHelper.getThreadManagerState();
		expect(state?.hasThread).toBe(true);
		expect(state?.threadPostsLength).toBeGreaterThan(0);
		expect(state?.isLoading).toBe(false);
		expect(state?.error).toBeNull();
	});

	test("should provide smooth scrolling", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);
		const perfHelper = new PerformanceTestHelper(vault.window);

		// Setup mock with large thread
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createLargeThreadData(1000),
		});

		// Load thread
		await threadHelper.openAndVerifyThreadView(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);
		await threadHelper.waitForThreadContent();

		const postCount = await threadHelper.getPostCount();
		console.log(`Testing scrolling with ${postCount} posts`);

		// Measure scroll performance
		const scrollResult =
			await perfHelper.measureScrollPerformance(".posts-container");

		console.log(`Scroll operations time: ${scrollResult.totalTime}ms`);

		// Verify scrolling completed successfully
		expect(scrollResult.finalScrollTop).toBe(0);
		expect(scrollResult.totalTime).toBeLessThan(1000);
	});

	test("should validate memory usage", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);
		const perfHelper = new PerformanceTestHelper(vault.window);

		// Setup large thread mock
		const mockData = MockDataFactory.createLargeThreadData(1000);
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: mockData,
		});

		// Check memory leak
		const memoryResult = await perfHelper.checkMemoryLeak(
			async () => {
				// Before: Load thread
				await threadHelper.openAndVerifyThreadView(
					PLUGIN_ID,
					"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
				);
				await threadHelper.waitForThreadContent();
			},
			async () => {
				// Action: Use the thread
				await vault.window.waitForTimeout(500);
			},
			async () => {
				// After: Close thread
				await threadHelper.closeThreadView();
			},
		);

		console.log(
			`Memory - Initial: ${memoryResult.initialMemory}, After load: ${memoryResult.afterLoadMemory}, After cleanup: ${memoryResult.afterCleanupMemory}`,
		);

		// Verify memory usage is reasonable
		if (memoryResult.initialMemory > 0 && memoryResult.afterLoadMemory > 0) {
			console.log(`Memory increase: ${memoryResult.memoryIncrease} bytes`);
			expect(memoryResult.memoryIncrease).toBeLessThan(10 * 1024 * 1024);

			if (memoryResult.afterCleanupMemory > 0) {
				console.log(
					`Memory after cleanup: ${memoryResult.memoryAfterCleanup} bytes`,
				);
				expect(memoryResult.memoryAfterCleanup).toBeLessThan(15 * 1024 * 1024);
			}
		}
	});

	test("should refresh efficiently", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);
		const perfHelper = new PerformanceTestHelper(vault.window);

		// Setup mock with large thread
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createLargeThreadData(1000),
		});

		// Initial load
		await threadHelper.openAndVerifyThreadView(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);
		await threadHelper.waitForThreadContent();

		const initialPostCount = await threadHelper.getPostCount();
		console.log(`Initial post count: ${initialPostCount}`);

		// Measure refresh performance
		const refreshTime = await perfHelper.measureExecutionTime(async () => {
			await threadHelper.clickRefreshButton();
			await threadHelper.waitForThreadContent(10000);
		});

		console.log(`Refresh time: ${refreshTime}ms`);

		// Verify refresh completed
		const postCountAfterRefresh = await threadHelper.getPostCount();
		expect(postCountAfterRefresh).toBeGreaterThan(0);
		expect(refreshTime).toBeLessThan(10000);

		// Verify state consistency
		const state = await threadHelper.getThreadManagerState();
		expect(state?.hasThread).toBe(true);
		expect(state?.isLoading).toBe(false);
		expect(state?.error).toBeNull();
	});

	test("should filter efficiently", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);
		const perfHelper = new PerformanceTestHelper(vault.window);

		// Setup mock with large thread
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createLargeThreadData(1000),
		});

		// Load thread
		await threadHelper.openAndVerifyThreadView(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);
		await threadHelper.waitForThreadContent();

		const postCount = await threadHelper.getPostCount();
		console.log(`Testing filters with ${postCount} posts`);

		// Test search filter performance
		const searchInput = vault.window.locator(
			'.thread-filters input[type="text"]',
		);
		if ((await searchInput.count()) > 0) {
			const filterTime = await perfHelper.measureExecutionTime(async () => {
				await threadHelper.applySearchFilter("test");
			});

			console.log(`Search filter operation time: ${filterTime}ms`);
			expect(filterTime).toBeLessThan(1000);

			await threadHelper.clearSearchFilter();
		}

		// Test filter button performance
		const filterButtons = vault.window.locator(".filter-buttons-group button");
		const buttonCount = await filterButtons.count();

		if (buttonCount > 0) {
			const buttonFilterTime = await perfHelper.measureExecutionTime(
				async () => {
					await filterButtons.first().click({ force: true });
					await vault.window.waitForTimeout(200);
				},
			);

			console.log(`Button filter time: ${buttonFilterTime}ms`);
			expect(buttonFilterTime).toBeLessThan(500);

			await filterButtons.first().click({ force: true });
		}

		// Verify filter state management
		const state = await threadHelper.getThreadManagerState();
		expect(state?.hasThread).toBe(true);
		expect(state?.filtersInitialized).toBe(true);
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
