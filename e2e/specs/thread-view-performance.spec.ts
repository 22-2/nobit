import { expect, test } from "../base";
import { BaseTestSetup, DEFAULT_TEST_CONFIG } from "../helpers/BaseTestSetup";
import { PerformanceTestHelper } from "../helpers/PerformanceTestHelper";

/**
 * Thread View Performance Tests
 * Refactored following SOLID principles
 */
test.describe("Thread View Performance Tests", () => {
	test("should handle current thread data smoothly", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);
		const perfHelper = new PerformanceTestHelper(vault.window);

		const loadTime = await perfHelper.measureExecutionTime(async () => {
			await setup.setupLargeThread(500);
		});

		console.log(`Thread load time: ${loadTime}ms`);

		const postCount = await setup.getThreadPage().getPostCount();
		console.log(`Loaded post count: ${postCount}`);
		expect(postCount).toBeGreaterThan(0);

		await setup.getThreadPage().verifyBasicUIStructure();
		expect(loadTime).toBeLessThan(10000);

		const state = await setup.getThreadPage().getThreadManagerState();
		expect(state?.hasThread).toBe(true);
		expect(state?.threadPostsLength).toBeGreaterThan(0);
		expect(state?.isLoading).toBe(false);
		expect(state?.error).toBeNull();
	});

	test("should provide smooth scrolling", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);
		const perfHelper = new PerformanceTestHelper(vault.window);

		await setup.setupLargeThread(1000);

		const postCount = await setup.getThreadPage().getPostCount();
		console.log(`Testing scrolling with ${postCount} posts`);

		const scrollResult =
			await perfHelper.measureScrollPerformance(".posts-container");

		console.log(`Scroll operations time: ${scrollResult.totalTime}ms`);

		expect(scrollResult.finalScrollTop).toBe(0);
		expect(scrollResult.totalTime).toBeLessThan(1000);
	});

	test("should validate memory usage", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);
		const perfHelper = new PerformanceTestHelper(vault.window);

		const memoryResult = await perfHelper.checkMemoryLeak(
			async () => {
				await setup.setupLargeThread(1000);
			},
			async () => {
				await vault.window.waitForTimeout(500);
			},
			async () => {
				await setup.getThreadPage().closeThreadView();
			},
		);

		console.log(
			`Memory - Initial: ${memoryResult.initialMemory}, After load: ${memoryResult.afterLoadMemory}, After cleanup: ${memoryResult.afterCleanupMemory}`,
		);

		if (memoryResult.initialMemory > 0 && memoryResult.afterLoadMemory > 0) {
			console.log(`Memory increase: ${memoryResult.memoryIncrease} bytes`);
			// macOS uses more memory, so we use a more generous limit
			const memoryLimit =
				process.platform === "darwin" ? 15 * 1024 * 1024 : 10 * 1024 * 1024;
			expect(memoryResult.memoryIncrease).toBeLessThan(memoryLimit);

			if (memoryResult.afterCleanupMemory > 0) {
				console.log(
					`Memory after cleanup: ${memoryResult.memoryAfterCleanup} bytes`,
				);
				const cleanupLimit =
					process.platform === "darwin" ? 20 * 1024 * 1024 : 15 * 1024 * 1024;
				expect(memoryResult.memoryAfterCleanup).toBeLessThan(cleanupLimit);
			}
		}
	});

	test("should refresh efficiently", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);
		const perfHelper = new PerformanceTestHelper(vault.window);

		await setup.setupLargeThread(1000);

		const initialPostCount = await setup.getThreadPage().getPostCount();
		console.log(`Initial post count: ${initialPostCount}`);

		const refreshTime = await perfHelper.measureExecutionTime(async () => {
			await setup.getThreadPage().clickRefreshButton();
			await setup.getThreadPage().waitForThreadContent(10000);
		});

		console.log(`Refresh time: ${refreshTime}ms`);

		const postCountAfterRefresh = await setup.getThreadPage().getPostCount();
		expect(postCountAfterRefresh).toBeGreaterThan(0);
		expect(refreshTime).toBeLessThan(10000);

		const state = await setup.getThreadPage().getThreadManagerState();
		expect(state?.hasThread).toBe(true);
		expect(state?.isLoading).toBe(false);
		expect(state?.error).toBeNull();
	});

	test("should filter efficiently", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);
		const perfHelper = new PerformanceTestHelper(vault.window);

		await setup.setupLargeThread(1000);

		const postCount = await setup.getThreadPage().getPostCount();
		console.log(`Testing filters with ${postCount} posts`);

		const searchInput = vault.window.locator(
			'.thread-filters input[type="text"]',
		);
		if ((await searchInput.count()) > 0) {
			const filterTime = await perfHelper.measureExecutionTime(async () => {
				await setup.getThreadPage().applyThreadSearchFilter("test");
			});

			console.log(`Search filter operation time: ${filterTime}ms`);
			expect(filterTime).toBeLessThan(1000);

			await setup.getThreadPage().clearThreadSearchFilter();
		}

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

		const state = await setup.getThreadPage().getThreadManagerState();
		expect(state?.hasThread).toBe(true);
		expect(state?.filtersInitialized).toBe(true);
	});
});

test.use(DEFAULT_TEST_CONFIG);
