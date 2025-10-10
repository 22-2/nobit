import { TestFetcherMockHelper } from "e2e/helpers/TestFetcherMockHelper";
import { expect, test } from "../base";
import { DIST_DIR, PLUGIN_ID } from "../constants";
import { MockDataFactory } from "../helpers/MockDataFactory";
import { ThreadViewPageObject } from "../helpers/ThreadViewPageObject";

/**
 * タイトルパースのデバッグテスト
 */
test.describe("Debug Title Parsing", () => {
	test("should parse title correctly from DAT format", async ({ vault }) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		const testData = MockDataFactory.createBasicThreadData();
		console.log("📦 Mock data first line:", testData.split("\n")[0]);

		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: testData,
		});

		const url = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1759626688/";
		await threadPage.openAndVerifyThreadView(PLUGIN_ID, url);
		await threadPage.waitForThreadContent();

		// ThreadManagerの状態を詳細に確認
		const debugInfo = await vault.window.evaluate(() => {
			const activeLeaf = app.workspace.activeLeaf;
			if (activeLeaf && activeLeaf.view.getViewType() === "thread-view") {
				const threadView = activeLeaf.view as any;
				const thread = threadView.threadManager.thread;

				return {
					threadTitle: thread?.title,
					firstPostContent: thread?.posts?.[0]?.content,
					firstPostRaw: thread?.posts?.[0],
					titleElText: threadView.titleEl?.innerText,
					getDisplayText: threadView.getDisplayText(),
				};
			}
			return null;
		});

		console.log("🔍 Debug info:", JSON.stringify(debugInfo, null, 2));

		expect(debugInfo?.threadTitle).toBe("基本テストスレッド");
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
