import { PLUGIN_ID } from "e2e/constants";
import { TestFetcherMockHelper } from "e2e/helpers/TestFetcherMockHelper";
import { ThreadViewPageObject } from "e2e/helpers/ThreadViewPageObject";
import { expect, test } from "../base";
import { BaseTestSetup, DEFAULT_TEST_CONFIG } from "../helpers/BaseTestSetup";
import { MockDataFactory } from "../helpers/MockDataFactory";
import { TitleTestHelper } from "../helpers/TitleTestHelper";

/**
 * Thread Title Reliability Tests
 * Refactored following SOLID principles
 */
test.describe("Thread Title Reliability Tests", () => {
	test("should display thread title immediately after load", async ({
		vault,
	}) => {
		const setup = new BaseTestSetup(vault);
		const titleHelper = new TitleTestHelper(
			vault.window,
			setup.getThreadPage(),
		);

		await setup.setupCustomThread({
			title: "基本テストスレッド",
			postCount: 10,
		});

		await titleHelper.verifyAllTitles("基本テストスレッド");
	});

	test("should update title when navigating to different thread", async ({
		vault,
	}) => {
		const setup = new BaseTestSetup(vault);
		const titleHelper = new TitleTestHelper(
			vault.window,
			setup.getThreadPage(),
		);

		await setup.setupCustomThread({
			title: "最初のスレッドタイトル",
			postCount: 10,
			url: "http://bbs.eddibb.cc/test/read.cgi/liveedge/1111111111/",
		});

		const firstTitle = await setup.getThreadPage().getTabHeaderText();
		expect(firstTitle).toContain("最初のスレッドタイトル");
		console.log("✓ First thread title:", firstTitle);

		await setup.getMockHelper().setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: "2番目のスレッドタイトル",
				postCount: 20,
			}),
		});

		const secondUrl =
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/2222222222/";
		await titleHelper.navigateViaTitle(secondUrl);

		const secondTitle = await setup.getThreadPage().getTabHeaderText();
		expect(secondTitle).toContain("2番目のスレッドタイトル");
		expect(secondTitle).not.toBe(firstTitle);
		console.log("✓ Second thread title:", secondTitle);

		const state = await setup.getThreadPage().getThreadManagerState();
		expect(state?.threadTitle).toContain("2番目のスレッドタイトル");
		expect(state?.threadUrl).toBe(secondUrl);
		console.log("✓ ThreadManager state updated correctly");
	});

	test("should preserve title after refresh", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);

		await setup.setupCustomThread({
			title: "リフレッシュテストスレッド",
			postCount: 15,
		});

		const originalTitle = await setup.getThreadPage().getTabHeaderText();
		expect(originalTitle).toContain("リフレッシュテストスレッド");
		console.log("✓ Original title:", originalTitle);

		await setup.getThreadPage().clickRefreshButton();
		await setup.getThreadPage().waitForThreadContent(10000);

		const titleAfterRefresh = await setup
			.getThreadPage()
			.getTabHeaderText();
		expect(titleAfterRefresh).toBe(originalTitle);
		console.log("✓ Title preserved after refresh:", titleAfterRefresh);
	});

	test("should handle title with special characters", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);
		const titleHelper = new TitleTestHelper(
			vault.window,
			setup.getThreadPage(),
		);

		const specialTitle = "【速報】テスト特殊文字スレッド🔥💯";
		await setup.setupCustomThread({
			title: specialTitle,
			postCount: 5,
		});

		const displayedTitle = await setup.getThreadPage().getTabHeaderText();
		expect(displayedTitle).toBeTruthy();
		expect(displayedTitle).toContain("速報");
		console.log("✓ Special characters title displayed:", displayedTitle);

		const state = await setup.getThreadPage().getThreadManagerState();
		expect(state?.threadTitle).toBeTruthy();
		console.log(
			"✓ ThreadManager has title with special chars:",
			state?.threadTitle,
		);
	});

	test.skip("should display title even with slow network", async ({
		vault,
	}) => {
		// TODO: Implement delay support - mock handler must be synchronous
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		const url = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1760077207/";
		await threadPage.openAndVerifyThreadView(PLUGIN_ID, url);
		await threadPage.waitForThreadContent(15000);

		const finalTitle = await threadPage.getTabHeaderText();
		expect(finalTitle).toBeTruthy();
		expect(finalTitle).not.toBe("5ch Thread");
		console.log("✓ Title updated after load:", finalTitle);
	});

	test("should handle title in multiple ThreadViews", async ({ vault }) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// 1つ目のスレッド
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: "1つ目のスレッド",
				postCount: 10,
			}),
		});

		const firstUrl =
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1111111111/";
		await threadPage.openAndVerifyThreadView(PLUGIN_ID, firstUrl);
		await threadPage.waitForThreadContent();

		const firstTitle = await threadPage.getTabHeaderText();
		expect(firstTitle).toContain("1つ目のスレッド");
		console.log("✓ First view title:", firstTitle);

		// 2つ目のスレッドを新しいタブで開く
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: "2つ目のスレッド",
				postCount: 20,
			}),
		});

		const secondUrl =
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/2222222222/";
		await threadPage.openPluginWithURL(PLUGIN_ID, secondUrl);
		await threadPage.waitForThreadContent();

		// 2つ目のタイトルを確認（アクティブなタブ）
		const secondTitle = await threadPage.getTabHeaderText();
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
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: "getDisplayTextテスト",
				postCount: 5,
			}),
		});

		const url = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1759626688/";
		await threadPage.openAndVerifyThreadView(PLUGIN_ID, url);
		await threadPage.waitForThreadContent();

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

	test.skip("should handle empty or missing title gracefully", async ({
		vault,
	}) => {
		// TODO: Parser currently throws error for empty titles
		// Consider allowing empty titles with fallback to "無題"
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// タイトルなしのスレッドデータ
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createThreadData({
				title: "",
				postCount: 5,
			}),
		});

		const url = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1759626688/";
		await threadPage.openAndVerifyThreadView(PLUGIN_ID, url);
		await threadPage.waitForThreadContent();

		// デフォルトタイトルが表示されることを確認
		const displayedTitle = await threadPage.getTabHeaderText();
		expect(displayedTitle).toBeTruthy();
		console.log(
			"✓ Fallback title displayed for empty title:",
			displayedTitle,
		);
	});

	test("should sync title between ThreadManager and ThreadView", async ({
		vault,
	}) => {
		const setup = new BaseTestSetup(vault);
		const titleHelper = new TitleTestHelper(
			vault.window,
			setup.getThreadPage(),
		);

		await setup.setupCustomThread({
			title: "同期テストスレッド",
			postCount: 10,
		});

		await titleHelper.verifyTitleConsistency("同期テストスレッド");
	});

	test("should maintain title after applying filters", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);

		await setup.setupCustomThread({
			title: "フィルターテストスレッド",
			postCount: 20,
		});

		const originalTitle = await setup.getThreadPage().getTabHeaderText();
		expect(originalTitle).toContain("フィルターテストスレッド");

		await setup.getThreadPage().applyThreadSearchFilter("test");
		await vault.window.waitForTimeout(500);

		const titleAfterFilter = await setup.getThreadPage().getTabHeaderText();
		expect(titleAfterFilter).toBe(originalTitle);
		console.log("✓ Title maintained after applying filter");

		await setup.getThreadPage().clearThreadSearchFilter();
		await vault.window.waitForTimeout(300);

		const titleAfterClear = await setup.getThreadPage().getTabHeaderText();
		expect(titleAfterClear).toBe(originalTitle);
		console.log("✓ Title maintained after clearing filter");
	});
});

test.use(DEFAULT_TEST_CONFIG);
