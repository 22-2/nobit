import { expect, test } from "../base";
import { PLUGIN_ID } from "../constants";
import { BaseTestSetup, DEFAULT_TEST_CONFIG } from "../helpers/BaseTestSetup";

/**
 * URL History Tests
 * Refactored following SOLID principles
 */
test.describe("URL History", () => {
	test("should save thread title to history after loading", async ({
		vault,
	}) => {
		const setup = new BaseTestSetup(vault);

		const threadData = `テスト太郎<>sage<>2025/10/10(金) 12:00:00.00 ID:test1234<>これはテストスレッドです<>【テスト】タイトルテストスレッド
テスト次郎<>sage<>2025/10/10(金) 12:01:00.00 ID:test5678<>レス1です<>
テスト三郎<>sage<>2025/10/10(金) 12:02:00.00 ID:test9012<>レス2です<>`;

		await setup.getMockHelper().setupPatternMock(".dat", {
			status: 200,
			body: threadData,
		});

		const testUrl = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1760001770/";
		await setup.getThreadPage().openAndVerifyThreadView(PLUGIN_ID, testUrl);
		await setup.getThreadPage().waitForThreadContent();

		const threadTitle = await setup.getThreadPage().getThreadHeaderTitle();
		expect(threadTitle).toBe("【テスト】タイトルテストスレッド");

		await vault.window.waitForTimeout(500);

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
		const setup = new BaseTestSetup(vault);

		const threadData = `エッヂの名無し<><>2025/10/09(木) 18:22:50.705 ID:Whnycgp4U<> 【速報】高市氏が菅元首相と会談<>【政治】実際のスレッドタイトル
エッヂの名無し<><>2025/10/09(木) 18:23:00.00 ID:test5678<>レス1です<>
エッヂの名無し<><>2025/10/09(木) 18:24:00.00 ID:test9012<>レス2です<>`;

		await setup.getMockHelper().setupPatternMock(".dat", {
			status: 200,
			body: threadData,
		});

		const testUrl = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1760001770/";
		await setup.getThreadPage().openAndVerifyThreadView(PLUGIN_ID, testUrl);
		await setup.getThreadPage().waitForThreadContent();

		const threadTitle = await setup.getThreadPage().getThreadHeaderTitle();
		expect(threadTitle).toBe("【政治】実際のスレッドタイトル");
		expect(threadTitle).not.toBe("無題");
	});
});

test.use(DEFAULT_TEST_CONFIG);
