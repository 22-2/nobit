import { expect, test } from "../base";
import { BaseTestSetup, DEFAULT_TEST_CONFIG } from "../helpers/BaseTestSetup";
import { TitleTestHelper } from "../helpers/TitleTestHelper";

/**
 * EditableTitleBar URL Navigation Tests
 * Refactored following SOLID principles
 */
test.describe("EditableTitleBar URL Navigation Tests", () => {
	test("should navigate to thread when URL is entered in title bar", async ({
		vault,
	}) => {
		const setup = new BaseTestSetup(vault);
		const titleHelper = new TitleTestHelper(
			vault.window,
			setup.getThreadPage(),
		);

		await setup.setupBasicThread();
		console.log("Initial thread loaded");

		const newUrl = "http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/";
		await titleHelper.navigateViaTitle(newUrl);

		const state = await setup.getThreadPage().getThreadManagerState();
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
		const setup = new BaseTestSetup(vault);
		const titleHelper = new TitleTestHelper(
			vault.window,
			setup.getThreadPage(),
		);

		await setup.setupBasicThread();
		await titleHelper.testTitleRestoration("基本テストスレッド");
	});
});

test.use(DEFAULT_TEST_CONFIG);
