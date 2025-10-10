import { expect, test } from "../base";
import { DIST_DIR, PLUGIN_ID } from "../constants";
import { TestFetcherMockHelper } from "../helpers/TestFetcherMockHelper";
import { ThreadViewPageObject } from "../helpers/ThreadViewPageObject";

test.describe("URL History", () => {
	test("should save thread title to history after loading", async ({
		vault,
	}) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// Setup mock with a thread that has a proper title (5 fields format)
		const threadData = `テスト太郎<>sage<>2025/10/10(金) 12:00:00.00 ID:test1234<>これはテストスレッドです<>【テスト】タイトルテストスレッド
テスト次郎<>sage<>2025/10/10(金) 12:01:00.00 ID:test5678<>レス1です<>
テスト三郎<>sage<>2025/10/10(金) 12:02:00.00 ID:test9012<>レス2です<>`;

		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: threadData,
		});

		const testUrl = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1760001770/";

		// Open thread
		await threadPage.openAndVerifyThreadView(PLUGIN_ID, testUrl);
		await threadPage.waitForThreadContent();

		// Get the thread title from the UI
		const threadTitle = await threadPage.getThreadHeaderTitle();
		expect(threadTitle).toBe("【テスト】タイトルテストスレッド");

		// Wait for history to be saved
		await vault.window.waitForTimeout(500);

		// Check that the history was saved with the correct title
		const history = await vault.window.evaluate((pluginId) => {
			const plugin = (window as any).app.plugins.plugins[pluginId];
			return plugin.settings.urlHistory;
		}, PLUGIN_ID);

		expect(history).toBeDefined();
		expect(history.length).toBeGreaterThan(0);

		const lastEntry = history[history.length - 1];
		expect(lastEntry.url).toBe(testUrl);
		expect(lastEntry.title).toBe("【テスト】タイトルテストスレッド");
		expect(lastEntry.title).not.toBe("無題");
		expect(lastEntry.title).not.toBe("1760001770");
	});

	test("should handle dat format with 5 fields correctly", async ({
		vault,
	}) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// This is the actual format from eddibb.cc (5 fields, title in index 4)
		const threadData = `エッヂの名無し<><>2025/10/09(木) 18:22:50.705 ID:Whnycgp4U<> 【速報】高市氏が菅元首相と会談<>【政治】実際のスレッドタイトル
エッヂの名無し<><>2025/10/09(木) 18:23:00.00 ID:test5678<>レス1です<>
エッヂの名無し<><>2025/10/09(木) 18:24:00.00 ID:test9012<>レス2です<>`;

		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: threadData,
		});

		const testUrl = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1760001770/";

		// Open thread
		await threadPage.openAndVerifyThreadView(PLUGIN_ID, testUrl);
		await threadPage.waitForThreadContent();

		// Get the thread title
		const threadTitle = await threadPage.getThreadHeaderTitle();
		expect(threadTitle).toBe("【政治】実際のスレッドタイトル");
		expect(threadTitle).not.toBe("無題");
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
