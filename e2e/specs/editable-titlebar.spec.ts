import { TestFetcherMockHelper } from "e2e/helpers/TestFetcherMockHelper";
import { expect, test } from "../base";
import { DIST_DIR, PLUGIN_ID } from "../constants";
import { MockDataFactory } from "../helpers/MockDataFactory";
import { ThreadViewPageObject } from "../helpers/ThreadViewPageObject";

/**
 * EditableTitleBar URL入力機能のテスト
 */
test.describe("EditableTitleBar URL Navigation Tests", () => {
	test("should navigate to thread when URL is entered in title bar", async ({
		vault,
	}) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// Setup mock for initial thread
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		// Open initial ThreadView
		const initialUrl =
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759626688/";
		await threadPage.openAndVerifyThreadView(PLUGIN_ID, initialUrl);
		await threadPage.waitForThreadContent();

		console.log("Initial thread loaded");

		// Get the title element for the active thread view
		const titleEl = vault.window.locator(
			".workspace-leaf.mod-active .view-header-title",
		);
		await expect(titleEl).toBeVisible();

		// Click on title to focus
		await titleEl.click();
		await vault.window.waitForTimeout(100);

		// Verify title is editable
		const isEditable = await titleEl.evaluate((el: HTMLElement) => {
			return el.contentEditable === "true";
		});
		expect(isEditable).toBe(true);
		console.log("Title bar is editable");

		// Enter new URL
		const newUrl = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/";
		await titleEl.fill(newUrl);

		// Press Enter to navigate
		await titleEl.press("Enter");
		await vault.window.waitForTimeout(500);

		console.log("Pressed Enter to navigate to new URL");

		// Wait for new thread to load
		await threadPage.waitForThreadContent(10000);

		// Verify navigation occurred
		const state = await threadPage.getThreadManagerState();
		console.log("Thread state after navigation:", state);

		expect(state?.threadUrl).toBe(newUrl);
		expect(state?.hasThread).toBe(true);
		expect(state?.isLoading).toBe(false);

		console.log(
			"✓ Successfully navigated to new thread via title bar URL input",
		);
	});

	test("should restore display text on blur without Enter", async ({
		vault,
	}) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// Setup mock
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		// Open ThreadView
		const url = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1759626688/";
		await threadPage.openAndVerifyThreadView(PLUGIN_ID, url);
		await threadPage.waitForThreadContent();

		// Get original title for the active thread view
		const titleEl = vault.window.locator(
			".workspace-leaf.mod-active .view-header-title",
		);
		const originalTitle = await titleEl.textContent();
		console.log("Original title:", originalTitle);

		// Click and edit title
		await titleEl.click();
		await vault.window.waitForTimeout(100);
		await titleEl.fill("Some random text");

		// Blur without pressing Enter
		await vault.window.locator("body").click();
		await vault.window.waitForTimeout(300);

		// Verify title is restored
		const restoredTitle = await titleEl.textContent();
		expect(restoredTitle).toBe("基本テストスレッド");

		console.log("✓ Title restored on blur without Enter");
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
