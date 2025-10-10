import { TestFetcherMockHelper } from "e2e/helpers/TestFetcherMockHelper";
import { expect, test } from "../base";
import { DIST_DIR, PLUGIN_ID } from "../constants";
import { MockDataFactory } from "../helpers/MockDataFactory";
import { ObsidianPageObject } from "../helpers/ObsidianPageObject";
import { ThreadViewTestHelper } from "../helpers/ThreadViewTestHelper";

/**
 * スレッドタイトル取得の信頼性テスト
 * タイトルが確実に取得・表示されることを様々なシナリオで検証
 */
test.describe("Thread Title Reliability Tests", () => {
	test("should display thread title immediately after load", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: "基本テストスレッド",
				postCount: 10
			})
		});

		const url = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1759626688/";
		await threadHelper.openAndVerifyThreadView(PLUGIN_ID, url);
		await threadHelper.waitForThreadContent();

		// タイトルバーのタイトルを確認
		const tabHeaderText = await threadHelper.getTabHeaderText();
		expect(tabHeaderText).toBeTruthy();
		expect(tabHeaderText).toBe("基本テストスレッド");
		console.log("✓ Tab header displays thread title:", tabHeaderText);

		// スレッドヘッダーのタイトルを確認
		const headerTitle = await threadHelper.getThreadHeaderTitle();
		expect(headerTitle).toBeTruthy();
		expect(headerTitle).toBe(tabHeaderText);
		console.log("✓ Thread header displays same title:", headerTitle);

		// ThreadManagerの状態を確認
		const state = await threadHelper.getThreadManagerState();
		expect(state?.threadTitle).toBeTruthy();
		expect(state?.threadTitle).toBe(tabHeaderText);
		console.log("✓ ThreadManager state has correct title:", state?.threadTitle);
	});

	test("should update title when navigating to different thread", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// 最初のスレッド用のモック
		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: "最初のスレッドタイトル",
				postCount: 10
			})
		});

		const firstUrl = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1111111111/";
		await threadHelper.openAndVerifyThreadView(PLUGIN_ID, firstUrl);
		await threadHelper.waitForThreadContent();

		const firstTitle = await threadHelper.getTabHeaderText();
		expect(firstTitle).toContain("最初のスレッドタイトル");
		console.log("✓ First thread title:", firstTitle);

		// 2番目のスレッド用のモック
		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: "2番目のスレッドタイトル",
				postCount: 20
			})
		});

		// タイトルバーから新しいURLに移動
		const titleEl = vault.window.locator(".workspace-leaf.mod-active .view-header-title");
		await titleEl.click();
		await vault.window.waitForTimeout(100);

		const secondUrl = "http://bbs.eddibb.cc/test/read.cgi/liveedge/2222222222/";
		await titleEl.fill(secondUrl);
		await titleEl.press("Enter");
		await vault.window.waitForTimeout(500);

		await threadHelper.waitForThreadContent(10000);

		// タイトルが更新されたことを確認
		const secondTitle = await threadHelper.getTabHeaderText();
		expect(secondTitle).toContain("2番目のスレッドタイトル");
		expect(secondTitle).not.toBe(firstTitle);
		console.log("✓ Second thread title:", secondTitle);

		// ThreadManagerの状態も更新されていることを確認
		const state = await threadHelper.getThreadManagerState();
		expect(state?.threadTitle).toContain("2番目のスレッドタイトル");
		expect(state?.threadUrl).toBe(secondUrl);
		console.log("✓ ThreadManager state updated correctly");
	});

	test("should preserve title after refresh", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: "リフレッシュテストスレッド",
				postCount: 15
			})
		});

		const url = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1759626688/";
		await threadHelper.openAndVerifyThreadView(PLUGIN_ID, url);
		await threadHelper.waitForThreadContent();

		const originalTitle = await threadHelper.getTabHeaderText();
		expect(originalTitle).toContain("リフレッシュテストスレッド");
		console.log("✓ Original title:", originalTitle);

		// リフレッシュ
		await threadHelper.clickRefreshButton();
		await threadHelper.waitForThreadContent(10000);

		// タイトルが保持されていることを確認
		const titleAfterRefresh = await threadHelper.getTabHeaderText();
		expect(titleAfterRefresh).toBe(originalTitle);
		console.log("✓ Title preserved after refresh:", titleAfterRefresh);
	});

	test("should handle title with special characters", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		const specialTitle = "【速報】テスト特殊文字スレッド🔥💯";
		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: specialTitle,
				postCount: 5
			})
		});

		const url = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1759626688/";
		await threadHelper.openAndVerifyThreadView(PLUGIN_ID, url);
		await threadHelper.waitForThreadContent();

		const displayedTitle = await threadHelper.getTabHeaderText();
		expect(displayedTitle).toBeTruthy();
		expect(displayedTitle).toContain("速報");
		console.log("✓ Special characters title displayed:", displayedTitle);

		// ThreadManagerの状態も確認
		const state = await threadHelper.getThreadManagerState();
		expect(state?.threadTitle).toBeTruthy();
		console.log("✓ ThreadManager has title with special chars:", state?.threadTitle);
	});

	test.skip("should display title even with slow network", async ({ vault }) => {
		// TODO: Implement delay support - mock handler must be synchronous
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createBasicThreadData()
		});

		const url = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1760077207/";
		await threadHelper.openAndVerifyThreadView(PLUGIN_ID, url);
		await threadHelper.waitForThreadContent(15000);

		const finalTitle = await threadHelper.getTabHeaderText();
		expect(finalTitle).toBeTruthy();
		expect(finalTitle).not.toBe("5ch Thread");
		console.log("✓ Title updated after load:", finalTitle);
	});

	test("should handle title in multiple ThreadViews", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// 1つ目のスレッド
		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: "1つ目のスレッド",
				postCount: 10
			})
		});

		const firstUrl = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1111111111/";
		await threadHelper.openAndVerifyThreadView(PLUGIN_ID, firstUrl);
		await threadHelper.waitForThreadContent();

		const firstTitle = await threadHelper.getTabHeaderText();
		expect(firstTitle).toContain("1つ目のスレッド");
		console.log("✓ First view title:", firstTitle);

		// 2つ目のスレッドを新しいタブで開く
		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: "2つ目のスレッド",
				postCount: 20
			})
		});

		const secondUrl = "http://bbs.eddibb.cc/test/read.cgi/liveedge/2222222222/";
		await obsPage.openPluginWithURL(PLUGIN_ID, secondUrl);
		await threadHelper.waitForThreadContent();

		// 2つ目のタイトルを確認（アクティブなタブ）
		const secondTitle = await threadHelper.getTabHeaderText();
		expect(secondTitle).toContain("2つ目のスレッド");
		console.log("✓ Second view title:", secondTitle);

		// 両方のThreadViewが存在することを確認
		const threadViewCount = await vault.window.evaluate(() => {
			return app.workspace.getLeavesOfType("thread-view").length;
		});
		expect(threadViewCount).toBe(2);
		console.log("✓ Both ThreadViews exist with correct titles");
	});

	test("should update title in getDisplayText method", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: "getDisplayTextテスト",
				postCount: 5
			})
		});

		const url = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1759626688/";
		await threadHelper.openAndVerifyThreadView(PLUGIN_ID, url);
		await threadHelper.waitForThreadContent();

		// getDisplayText()の戻り値を確認
		const displayText = await vault.window.evaluate(() => {
			const activeLeaf = app.workspace.activeLeaf;
			if (activeLeaf && activeLeaf.view.getViewType() === "thread-view") {
				return (activeLeaf.view as any).getDisplayText();
			}
			return null;
		});

		expect(displayText).toBeTruthy();
		expect(displayText).toContain("getDisplayTextテスト");
		console.log("✓ getDisplayText() returns correct title:", displayText);
	});

	test.skip("should handle empty or missing title gracefully", async ({ vault }) => {
		// TODO: Parser currently throws error for empty titles
		// Consider allowing empty titles with fallback to "無題"
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// タイトルなしのスレッドデータ
		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: "",
				postCount: 5
			})
		});

		const url = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1759626688/";
		await threadHelper.openAndVerifyThreadView(PLUGIN_ID, url);
		await threadHelper.waitForThreadContent();

		// デフォルトタイトルが表示されることを確認
		const displayedTitle = await threadHelper.getTabHeaderText();
		expect(displayedTitle).toBeTruthy();
		console.log("✓ Fallback title displayed for empty title:", displayedTitle);
	});

	test("should sync title between ThreadManager and ThreadView", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: "同期テストスレッド",
				postCount: 10
			})
		});

		const url = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1759626688/";
		await threadHelper.openAndVerifyThreadView(PLUGIN_ID, url);
		await threadHelper.waitForThreadContent();

		// 3箇所のタイトルが一致することを確認
		const consistency = await threadHelper.verifyTitleConsistency();

		expect(consistency.titleBar).toBeTruthy();
		expect(consistency.allMatch).toBe(true);
		console.log("✓ All three title sources are synchronized:", consistency.titleBar);
	});

	test("should maintain title after applying filters", async ({ vault }) => {
		const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
		const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		await mockHelper.setupPatternMock('.dat', {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: "フィルターテストスレッド",
				postCount: 20
			})
		});

		const url = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1759626688/";
		await threadHelper.openAndVerifyThreadView(PLUGIN_ID, url);
		await threadHelper.waitForThreadContent();

		const originalTitle = await threadHelper.getTabHeaderText();
		expect(originalTitle).toContain("フィルターテストスレッド");

		// フィルターを適用
		await threadHelper.applySearchFilter("test");
		await vault.window.waitForTimeout(500);

		// タイトルが変わっていないことを確認
		const titleAfterFilter = await threadHelper.getTabHeaderText();
		expect(titleAfterFilter).toBe(originalTitle);
		console.log("✓ Title maintained after applying filter");

		// フィルターをクリア
		await threadHelper.clearSearchFilter();
		await vault.window.waitForTimeout(300);

		// タイトルがまだ同じことを確認
		const titleAfterClear = await threadHelper.getTabHeaderText();
		expect(titleAfterClear).toBe(originalTitle);
		console.log("✓ Title maintained after clearing filter");
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
