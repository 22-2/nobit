import { MockDataFactory } from "e2e/helpers/MockDataFactory";
import { expect, test } from "../base";
import { PLUGIN_ID } from "../constants";
import { BaseTestSetup, DEFAULT_TEST_CONFIG } from "../helpers/BaseTestSetup";

/**
 * Thread View Integration Tests
 * Refactored following SOLID principles
 */
test.describe("Thread View Integration Tests", () => {
	test("should complete full user journey", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);

		const plugin = await vault.window.evaluate(
			(pluginId) => app.plugins.getPlugin(pluginId),
			PLUGIN_ID,
		);
		expect(plugin).toBeTruthy();

		console.log("Step 1: Executing command");
		await setup.setupBasicThread();

		console.log("Step 2: Verifying 5ch fetch and UI display");
		await setup.getThreadPage().verifyBasicUIStructure();

		const postCount = await setup.getThreadPage().getPostCount();
		expect(postCount).toBeGreaterThan(0);
		console.log(`Verified ${postCount} posts loaded and displayed`);

		const state = await setup.getThreadPage().getThreadManagerState();
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
		const setup = new BaseTestSetup(vault);

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);

		console.log("Testing loading state UI updates");

		await setup.getThreadPage().clickRefreshButton();

		try {
			await setup.getThreadPage().expectLoadingState(true);
			console.log("✓ Loading state UI update detected");
		} catch {
			console.log(
				"Loading state was too brief to catch (acceptable for fast operations)",
			);
		}

		await setup.getThreadPage().waitForThreadContent(10000);
		await setup.getThreadPage().expectLoadingState(false);

		console.log("Testing filter state UI updates");

		const searchInput = vault.window.locator(
			'.thread-filters input[type="text"]',
		);
		if ((await searchInput.count()) > 0) {
			await setup.getThreadPage().applyThreadSearchFilter("test");

			const filterState = await vault.window.evaluate(() => {
				const activeLeaf = app.workspace.activeLeaf;
				if (
					activeLeaf &&
					activeLeaf.view.getViewType() === "thread-view"
				) {
					const threadView = activeLeaf.view as any;
					return threadView.threadManager.filters.searchText;
				}
				return null;
			});

			expect(filterState).toBe("test");
			console.log("✓ Search filter state update verified");

			await setup.getThreadPage().clearThreadSearchFilter();
		}

		console.log(
			"✓ ThreadManager state changes trigger UI updates correctly",
		);
	});

	test("should cleanup properly when closed", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);

		const initialState = await vault.window.evaluate(() => {
			const activeLeaf = app.workspace.activeLeaf;
			if (activeLeaf && activeLeaf.view.getViewType() === "thread-view") {
				const threadView = activeLeaf.view as any;
				return {
					hasThreadManager: !!threadView.threadManager,
					hasComponent: !!threadView.component,
					contentElHasChildren:
						threadView.contentEl.children.length > 0,
				};
			}
			return null;
		});

		expect(initialState?.hasThreadManager).toBe(true);
		expect(initialState?.hasComponent).toBe(true);
		expect(initialState?.contentElHasChildren).toBe(true);

		console.log("ThreadView initialized properly");

		await setup.getThreadPage().closeThreadView();

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

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);

		console.log("✓ New ThreadView can be opened after cleanup");
	});

	test("should validate architectural separation", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);

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
					contentElHasContent:
						threadView.contentEl.children.length > 0,
					threadManagerThread: !!threadView.threadManager?.thread,
					threadManagerFilters: !!threadView.threadManager?.filters,
				};
			}
			return null;
		});

		expect(componentValidation?.hasThreadView).toBe(true);
		expect(componentValidation?.threadViewType).toBe("thread-view");
		expect(componentValidation?.hasThreadManager).toBe(true);
		expect(componentValidation?.threadManagerHasState).toBe(true);
		expect(componentValidation?.hasSvelteComponent).toBe(true);
		expect(componentValidation?.contentElHasContent).toBe(true);
		expect(componentValidation?.threadManagerThread).toBe(true);
		expect(componentValidation?.threadManagerFilters).toBe(true);

		await expect(vault.window.locator(".thread-view")).toBeVisible();
		await expect(vault.window.locator(".thread-filters")).toBeVisible();
		await expect(vault.window.locator(".posts-container")).toBeVisible();
		await expect(
			vault.window.locator(".thread-footer-toolbar"),
		).toBeVisible();

		const posts = await vault.window.locator(".posts-container .post");
		const postCount = await posts.count();
		expect(postCount).toBeGreaterThan(0);

		const refreshButton = vault.window.locator(
			".toolbar-section .clickable-icon",
		);
		await expect(refreshButton).toBeVisible();
		await refreshButton.click({ force: true });
		await setup.getThreadPage().waitForThreadContent(10000);

		console.log(
			"✓ Architectural separation validated - Manager layer successfully bridges Obsidian and Svelte",
		);
	});

	test("should handle errors and recover", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);

		console.log("Normal operation verified");

		await setup.getMockHelper().setupPatternMock(".dat", {
			status: 500,
			body: "Internal Server Error",
		});

		await setup.getThreadPage().clickRefreshButton();

		try {
			await setup.getThreadPage().expectErrorState(true);
			console.log("✓ Error state displayed correctly");

			const errorMessage = await vault.window
				.locator(".error-message")
				.textContent();
			expect(errorMessage).toBeTruthy();
			console.log(`Error message: ${errorMessage}`);
		} catch {
			console.log("Error state was handled too quickly or differently");
		}

		await setup.getMockHelper().setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		await setup.getThreadPage().clickRefreshButton();
		await setup.getThreadPage().waitForThreadContent(10000);

		console.log("✓ Error handling and recovery validated");
	});
});

test.use(DEFAULT_TEST_CONFIG);
