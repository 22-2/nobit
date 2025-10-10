import { VIEW_TYPE_THREAD } from "src/utils/constants";
import { expect, test } from "../base";
import { DIST_DIR, PLUGIN_ID } from "../constants";
import { ObsidianPageObject } from "../helpers/ObsidianPageObject";
import { TestFetcherMockHelper } from "../helpers/TestFetcherMockHelper";
import { ThreadViewTestHelper } from "../helpers/ThreadViewTestHelper";

test.describe("Selection Dialog", () => {
	test("should open thread when selecting from history with Enter key", async ({
		vault,
	}) => {
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// Setup mock
		const threadData = `テスト太郎<>sage<>2025/10/10(金) 12:00:00.00 ID:test1234<>これはテストスレッドです<>【テスト】履歴選択テスト
テスト次郎<>sage<>2025/10/10(金) 12:01:00.00 ID:test5678<>レス1です<>`;

		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: threadData,
		});

		const testUrl = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1760001770/";

		// First, add an entry to history
		await vault.window.evaluate(
			async (args) => {
				const plugin = (window as any).app.plugins.plugins[args.pluginId];
				await plugin.addToUrlHistory(args.url, args.title);
			},
			{ pluginId: PLUGIN_ID, url: testUrl, title: "【テスト】履歴選択テスト" },
		);

		// Wait for history to be saved
		await vault.window.waitForTimeout(300);

		// Execute the open-with-url command
		await obsPage.runCommand(`${PLUGIN_ID}:open-with-url`);

		// Wait for the selection dialog to open
		await vault.window.waitForFunction(
			() => {
				const prompt = document.querySelector(".prompt");
				return prompt !== null;
			},
			{ timeout: 3000 },
		);

		// The first item should be our history entry (already selected with .is-selected)
		// Press Enter to select
		await vault.window.keyboard.press("Enter");

		// Wait for thread view to open
		await obsPage.waitForView(VIEW_TYPE_THREAD);
		await threadHelper.waitForThreadContent();

		// Verify the thread title
		const threadTitle = await threadHelper.getThreadHeaderTitle();
		expect(threadTitle).toBe("【テスト】履歴選択テスト");
	});

	test("should open thread when clicking on history item", async ({
		vault,
	}) => {
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// Setup mock
		const threadData = `テスト太郎<>sage<>2025/10/10(金) 12:00:00.00 ID:test1234<>これはテストスレッドです<>【テスト】クリック選択テスト
テスト次郎<>sage<>2025/10/10(金) 12:01:00.00 ID:test5678<>レス1です<>`;

		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: threadData,
		});

		const testUrl = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1760001771/";

		// Add entry to history
		await vault.window.evaluate(
			async (args) => {
				const plugin = (window as any).app.plugins.plugins[args.pluginId];
				await plugin.addToUrlHistory(args.url, args.title);
			},
			{
				pluginId: PLUGIN_ID,
				url: testUrl,
				title: "【テスト】クリック選択テスト",
			},
		);

		await vault.window.waitForTimeout(300);

		// Execute the open-with-url command
		await obsPage.runCommand(`${PLUGIN_ID}:open-with-url`);
		await vault.window.waitForTimeout(500);

		// Click on the first suggestion
		const clicked = await vault.window.evaluate(() => {
			const suggestion = document.querySelector(".suggestion-item");
			if (suggestion) {
				(suggestion as HTMLElement).click();
				return true;
			}
			return false;
		});
		expect(clicked).toBe(true);

		// Wait for thread view to open
		await obsPage.waitForView(VIEW_TYPE_THREAD);
		await threadHelper.waitForThreadContent();

		const threadTitle = await threadHelper.getThreadHeaderTitle();
		expect(threadTitle).toBe("【テスト】クリック選択テスト");
	});
});

test.use({
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
});
