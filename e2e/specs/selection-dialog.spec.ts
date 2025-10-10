import { test } from "../base";
import { BaseTestSetup, DEFAULT_TEST_CONFIG } from "../helpers/BaseTestSetup";
import { SelectionDialogHelper } from "../helpers/SelectionDialogHelper";

/**
 * Selection Dialog Tests
 * Refactored following SOLID principles
 */
test.describe("Selection Dialog", () => {
	test("should open thread when selecting from history with Enter key", async ({
		vault,
	}) => {
		const setup = new BaseTestSetup(vault);
		const dialogHelper = new SelectionDialogHelper(
			vault.window,
			setup.getThreadPage(),
		);

		const threadData = `テスト太郎<>sage<>2025/10/10(金) 12:00:00.00 ID:test1234<>これはテストスレッドです<>【テスト】履歴選択テスト
テスト次郎<>sage<>2025/10/10(金) 12:01:00.00 ID:test5678<>レス1です<>`;

		await setup.getMockHelper().setupPatternMock(".dat", {
			status: 200,
			body: threadData,
		});

		const testUrl = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1760001770/";

		await dialogHelper.testSelectionWithEnter(
			testUrl,
			"【テスト】履歴選択テスト",
			"【テスト】履歴選択テスト",
		);
	});

	test("should open thread when clicking on history item", async ({
		vault,
	}) => {
		const setup = new BaseTestSetup(vault);
		const dialogHelper = new SelectionDialogHelper(
			vault.window,
			setup.getThreadPage(),
		);

		const threadData = `テスト太郎<>sage<>2025/10/10(金) 12:00:00.00 ID:test1234<>これはテストスレッドです<>【テスト】クリック選択テスト
テスト次郎<>sage<>2025/10/10(金) 12:01:00.00 ID:test5678<>レス1です<>`;

		await setup.getMockHelper().setupPatternMock(".dat", {
			status: 200,
			body: threadData,
		});

		const testUrl = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1760001771/";

		await dialogHelper.testSelectionWithClick(
			testUrl,
			"【テスト】クリック選択テスト",
			"【テスト】クリック選択テスト",
		);
	});
});

test.use(DEFAULT_TEST_CONFIG);
